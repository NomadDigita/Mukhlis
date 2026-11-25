'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Upload } from 'tus-js-client';
import { isSupabaseConfigured, supabase, type Work } from '../../lib/supabase';

type AdminWork = Work & { published: boolean };
const MAX_UPLOAD_BYTES = 500 * 1024 * 1024;
const MAX_UPLOAD_LABEL = '500 MiB';

export default function Admin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [logged, setLogged] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState('');
  const [works, setWorks] = useState<AdminWork[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const activeUpload = useRef<Upload | null>(null);
  const cancelled = useRef(false);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase.from('works').select('*').order('created_at', { ascending: false });
    if (error) { setMessage(`Could not load recordings: ${error.message}`); return; }
    setWorks((data || []) as AdminWork[]);
  }, []);

  const checkAdmin = useCallback(async () => {
    setChecking(true);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    setLogged(Boolean(user));
    if (userError || !user) { setAuthorized(false); setChecking(false); return; }
    const { data, error } = await supabase.from('portfolio_admins').select('user_id').eq('user_id', user.id).maybeSingle();
    setAuthorized(Boolean(data && !error));
    if (data && !error) await refresh();
    setChecking(false);
  }, [refresh]);

  useEffect(() => {
    if (!isSupabaseConfigured) { setMessage('Add the Supabase URL and publishable key to enable the studio.'); setChecking(false); return; }
    checkAdmin();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { window.setTimeout(() => { checkAdmin(); }, 0); });
    return () => { subscription.unsubscribe(); activeUpload.current?.abort(true); };
  }, [checkAdmin]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setMessage(error.message); return; }
    await checkAdmin();
  }

  async function uploadFile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get('file');
    const title = String(data.get('title') || '').trim();
    const type = file instanceof File && file.type.startsWith('audio/') ? 'audio' : file instanceof File && file.type.startsWith('video/') ? 'video' : null;
    if (!(file instanceof File) || file.size === 0 || !type || !title) { setMessage('Add a title and choose a valid audio or video file.'); return; }
    if (file.size > MAX_UPLOAD_BYTES) { setMessage(`This file is larger than the ${MAX_UPLOAD_LABEL} upload limit.`); return; }
    const { data: { session } } = await supabase.auth.getSession();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!session?.access_token || !supabaseUrl || !apiKey) { setMessage('Your session or Supabase configuration is missing. Sign in again and retry.'); return; }
    const configuredHost = new URL(supabaseUrl).hostname;
    const storageHost = configuredHost.endsWith('.supabase.co') ? configuredHost.replace(/\.supabase\.co$/, '.storage.supabase.co') : configuredHost;

    const safeName = file.name.normalize('NFKC').replace(/[^\p{L}\p{N}._-]+/gu, '_').slice(-120) || 'recording';
    const fingerprintKey = `mukhlis-upload:${file.size}:${file.lastModified}:${encodeURIComponent(file.name)}`;
    const transferId = window.localStorage.getItem(fingerprintKey) || crypto.randomUUID();
    window.localStorage.setItem(fingerprintKey, transferId);
    const path = `${transferId}/${safeName}`;
    cancelled.current = false;
    setBusy(true); setProgress(0); setMessage('Preparing a resumable upload…');
    try {
      await new Promise<void>((resolve, reject) => {
        const transfer = new Upload(file, {
          endpoint: `https://${storageHost}/storage/v1/upload/resumable`,
          chunkSize: 6 * 1024 * 1024,
          retryDelays: [0, 1500, 3000, 6000, 10000],
          headers: { authorization: `Bearer ${session.access_token}`, apikey: apiKey, 'x-upsert': 'false' },
          metadata: { bucketName: 'portfolio-media', objectName: path, contentType: file.type, cacheControl: '3600' },
          allowedMetaFields: ['bucketName', 'objectName', 'contentType', 'cacheControl'],
          uploadDataDuringCreation: true,
          removeFingerprintOnSuccess: true,
          onProgress(bytesSent, bytesTotal) { setProgress(Math.min(100, Math.round(bytesSent / bytesTotal * 100))); setMessage(`Uploading ${Math.round(bytesSent / 1024 / 1024)} of ${Math.ceil(bytesTotal / 1024 / 1024)} MiB…`); },
          onError(error) { reject(error); },
          onSuccess() { resolve(); },
        });
        activeUpload.current = transfer;
        transfer.findPreviousUploads().then((previousUploads) => {
          if (previousUploads.length) transfer.resumeFromPreviousUpload(previousUploads[0]);
          transfer.start();
        }).catch(reject);
      });
      const { error } = await supabase.from('works').insert({ title, description: String(data.get('description') || '').trim(), category: String(data.get('category') || 'Arabic').trim() || 'Arabic', media_type: type, storage_path: path, published: false });
      if (error) {
        await supabase.storage.from('portfolio-media').remove([path]);
        throw new Error(`File uploaded, but its draft record could not be saved: ${error.message}`);
      }
      window.localStorage.removeItem(fingerprintKey);
      setProgress(100); setMessage('Upload complete. Saved privately as a draft.'); form.reset(); await refresh();
    } catch (error) {
      setMessage(cancelled.current ? 'Upload cancelled. Reselect the same file to resume it.' : error instanceof Error ? error.message : 'Upload failed. Check your connection and try again.');
    } finally {
      activeUpload.current = null; setBusy(false);
    }
  }

  function cancelUpload() {
    cancelled.current = true;
    activeUpload.current?.abort();
    setMessage('Cancelling upload…');
  }

  async function toggle(work: AdminWork) {
    const { error } = await supabase.from('works').update({ published: !work.published }).eq('id', work.id);
    if (error) { setMessage(error.message); return; }
    setMessage(work.published ? 'Recording returned to private drafts.' : 'Recording published.');
    await refresh();
  }

  async function remove(work: AdminWork) {
    if (!window.confirm(`Permanently delete “${work.title}” and its media file?`)) return;
    const { error: fileError } = await supabase.storage.from('portfolio-media').remove([work.storage_path]);
    if (fileError) { setMessage(`Could not remove the media file: ${fileError.message}`); return; }
    const { error } = await supabase.from('works').delete().eq('id', work.id);
    if (error) { setMessage(`Media file removed, but the record needs cleanup: ${error.message}`); return; }
    setMessage('Recording deleted.'); await refresh();
  }

  async function logout() { await supabase.auth.signOut(); setLogged(false); setAuthorized(false); setWorks([]); setMessage('Signed out.'); }

  return <main className="admin-shell">
    <header className="admin-topbar"><a className="brand" href="/"><span className="brand-mark">م</span><span className="brand-name">MUKHLIS <i>JAMIU</i></span></a><a className="admin-back" href="/">← Back to portfolio</a></header>
    <section className="admin-content">
      <p className="eyebrow"><span className="eyebrow-rule"/>PRIVATE WORKSPACE</p><h1>Portfolio studio<span>.</span></h1><p className="admin-lead">Manage recordings. Draft media stays private until you publish it.</p>
      {checking ? <div className="admin-panel" role="status">Checking your administrator access…</div> : !logged ? <form className="admin-panel admin-form" onSubmit={login}><h2>Administrator sign in</h2><label>Email<input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)}/></label><label>Password<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)}/></label><button className="button button-primary" type="submit">Sign in <span aria-hidden="true">↗</span></button></form> : !authorized ? <div className="admin-panel access-denied"><h2>This account does not have studio access.</h2><p>Ask the portfolio owner to add your account to the administrator list.</p><button className="button button-text" onClick={logout}>Sign out</button></div> : <>
        <div className="admin-toolbar"><span><i className="status-dot"/> Signed in · administrator</span><button className="button button-text" onClick={logout}>Sign out</button></div>
        <form className="admin-panel admin-form upload-form" onSubmit={uploadFile}>
          <div className="admin-panel-heading"><div><p className="eyebrow">NEW RECORDING</p><h2>Upload as a private draft</h2></div><span className="upload-limit">Up to {MAX_UPLOAD_LABEL}</span></div>
          <label>Title<input name="title" maxLength={180} placeholder="e.g. A short Arabic reading" required/></label>
          <label>Description<textarea name="description" rows={3} maxLength={1200} placeholder="A short note about this recording"/></label>
          <label>Category<input name="category" maxLength={80} defaultValue="Arabic" placeholder="Arabic, narration, lesson…"/></label>
          <label className="file-picker">Audio or video file<input name="file" type="file" accept="audio/*,video/*" required disabled={busy}/><small>Resumable transfer with retry support. The project plan may set a lower maximum.</small></label>
          {busy && <div className="upload-progress"><div className="progress-copy"><span>{message}</span><b>{progress}%</b></div><progress value={progress} max="100" aria-label="Upload progress"/></div>}
          <div className="upload-actions"><button className="button button-primary" type="submit" disabled={busy}>{busy ? 'Uploading…' : 'Upload private draft'}<span aria-hidden="true">↗</span></button>{busy && <button className="button button-text" type="button" onClick={cancelUpload}>Cancel upload</button>}</div>
        </form>
        <div className="admin-list-heading"><div><p className="eyebrow">YOUR LIBRARY</p><h2>Recordings <span>{works.length}</span></h2></div><button className="button button-text" onClick={() => refresh()}>Refresh</button></div>
        {works.length ? <div className="admin-list">{works.map((work) => <article className="admin-item" key={work.id}><div className="admin-item-main"><span className={`publish-state${work.published ? ' is-published' : ''}`}>{work.published ? 'Published' : 'Private draft'}</span><h3>{work.title}</h3><p>{work.media_type} · {work.category} · {new Date(work.created_at).toLocaleDateString()}</p></div><div className="admin-item-actions"><button className="button button-secondary" onClick={() => toggle(work)}>{work.published ? 'Unpublish' : 'Publish'}</button><button className="button button-danger" onClick={() => remove(work)}>Delete</button></div></article>)}</div> : <div className="admin-panel admin-empty"><span className="empty-mark">م</span><p>Your recording library is empty. New uploads start as private drafts.</p></div>}
      </>}
      {message && <p className="admin-message" role="status" aria-live="polite">{message}</p>}
    </section>
  </main>;
}
