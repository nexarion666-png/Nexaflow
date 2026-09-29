'use client';

import { useMemo, useState } from 'react';

type FileItem = { path:string; size:number };
type Repo = { id:number; full_name:string; private:boolean; default_branch:string };

export default function Home() {
  const [file,setFile]=useState<File|null>(null);
  const [files,setFiles]=useState<FileItem[]>([]);
  const [repos,setRepos]=useState<Repo[]>([]);
  const [repo,setRepo]=useState('');
  const [branch,setBranch]=useState('main');
  const [token,setToken]=useState('');
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);

  const total = useMemo(()=>files.reduce((n,f)=>n+f.size,0),[files]);

  function chooseZip(f:File) {
    setFile(f); setFiles([]);
    setMessage(`Selected ${f.name}. Tap Extract ZIP to unpack and preview its contents.`);
  }
  async function inspect() {
    if(!file) return setMessage('Upload a ZIP file first.');
    setMessage('Extracting ZIP and inspecting files…');
    const fd=new FormData(); fd.append('file',file);
    const r=await fetch('/api/inspect',{method:'POST',body:fd});
    const d=await r.json();
    if(!r.ok) return setMessage(d.error||'Could not extract ZIP.');
    setFiles(d.files); setMessage(`Extraction complete · ${d.files.length} files ready to push.`);
  }

  async function loadRepos() {
    setMessage('Loading GitHub repositories…');
    const r=await fetch('/api/repos',{headers:{authorization:`Bearer ${token}`}});
    const d=await r.json();
    if(!r.ok) return setMessage(d.error||'GitHub authentication failed.');
    setRepos(d.repos); if(d.repos[0]) { setRepo(d.repos[0].full_name); setBranch(d.repos[0].default_branch); }
    setMessage(`${d.repos.length} repositories loaded.`);
  }

  async function push() {
    if(!file||!repo) return setMessage('Choose a ZIP and repository first.');
    setBusy(true); setMessage('Pushing project to GitHub…');
    const fd=new FormData(); fd.append('file',file); fd.append('repo',repo); fd.append('branch',branch); fd.append('token',token);
    const r=await fetch('/api/push',{method:'POST',body:fd});
    const d=await r.json(); setBusy(false);
    if(!r.ok) return setMessage(d.error||'Push failed.');
    setMessage(`✓ Pushed ${d.count} files to ${repo}@${branch}.`);
  }

  return (
    <main className="min-h-screen overflow-hidden">
      <div className="absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(circle_at_20%_10%,#dbeafe,transparent_35%),radial-gradient(circle_at_80%_0%,#ede9fe,transparent_35%)]"/>
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-xl text-white shadow-lg shadow-blue-200">✦</div><div><div className="text-xl font-black tracking-tight">Nexa<span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">Flow</span></div><div className="text-[11px] font-medium text-slate-400">ZIP → GitHub</div></div></div>
        <a href="https://github.com" target="_blank" className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-white">GitHub ↗</a>
      </nav>

      <section className="mx-auto max-w-5xl px-5 pb-20 pt-10 text-center">
        <div className="mx-auto mb-5 w-fit rounded-full border border-blue-100 bg-white/80 px-4 py-2 text-xs font-bold text-blue-700 shadow-sm">⚡ Move code. Build faster.</div>
        <h1 className="text-5xl font-black tracking-tight text-slate-950 sm:text-7xl">From ZIP to <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">GitHub.</span></h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-500">Upload your project, inspect its files, choose a repository, and push everything in one clean workflow.</p>

        <div className="mt-10 rounded-[32px] border border-white bg-white/90 p-4 text-left shadow-[0_30px_80px_rgba(56,89,140,.14)] backdrop-blur">
          <label className="group flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-[26px] border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50/80 to-violet-50/60 px-6 transition hover:border-blue-400 hover:from-blue-50 hover:to-violet-50">
            <input type="file" accept=".zip,application/zip" className="hidden" onChange={e=>e.target.files?.[0]&&chooseZip(e.target.files[0])}/>
            <div className="mb-5 grid h-20 w-20 place-items-center rounded-3xl bg-white text-4xl shadow-xl shadow-blue-100">📦</div>
            <div className="text-xl font-extrabold text-slate-800">{file?file.name:'Drop your ZIP here'}</div>
            <div className="mt-2 text-sm text-slate-500">{file?`${files.length ? `${files.length} extracted files` : 'ZIP selected · not extracted yet'} · ${(file.size/1024/1024).toFixed(2)} MB`:'Tap to browse your phone files'}</div>
            <div className="mt-5 rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-500 shadow-sm">ZIP files up to 100 MB</div>
          </label>

          <button onClick={inspect} disabled={!file || busy} className="mt-4 w-full rounded-2xl border border-blue-200 bg-blue-50 py-3.5 font-extrabold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50">📂 Extract ZIP & Preview Files</button>

          <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto]">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">GitHub token</label>
              <input value={token} onChange={e=>setToken(e.target.value)} placeholder="ghp_… or fine-grained token" type="password" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none ring-blue-500 focus:ring-2"/>
            </div>
            <button onClick={loadRepos} className="self-end rounded-2xl bg-slate-950 px-5 py-3 font-bold text-white shadow-lg hover:bg-slate-800">Load repositories</button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div><label className="mb-2 block text-sm font-bold text-slate-700">Repository</label><select value={repo} onChange={e=>{setRepo(e.target.value); const x=repos.find(r=>r.full_name===e.target.value); if(x)setBranch(x.default_branch)}} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"><option value="">Select repository…</option>{repos.map(r=><option key={r.id} value={r.full_name}>{r.full_name}{r.private?' · private':''}</option>)}</select></div>
            <div><label className="mb-2 block text-sm font-bold text-slate-700">Branch</label><input value={branch} onChange={e=>setBranch(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"/></div>
          </div>

          {files.length>0 && <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4"><div className="mb-3 flex justify-between text-sm font-bold"><span>Project files</span><span className="text-slate-400">{files.length} files</span></div><div className="max-h-48 space-y-1 overflow-auto">{files.slice(0,80).map(f=><div key={f.path} className="rounded-lg bg-white px-3 py-2 text-sm text-slate-600">📄 {f.path}</div>)}{files.length>80&&<div className="p-2 text-xs text-slate-400">+ {files.length-80} more files</div>}</div></div>}

          <button disabled={busy || !file || files.length===0} onClick={push} className="mt-5 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 py-4 text-lg font-extrabold text-white shadow-xl shadow-blue-200 transition hover:-translate-y-0.5 hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-60">{busy?'🚀 Pushing…':files.length===0?'Extract ZIP before pushing':'🚀 Push extracted files to GitHub'}</button>
          {message&&<div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-center text-sm font-semibold text-slate-600">{message}</div>}
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-white p-4 shadow-sm">🔒 <b>Safe paths</b><div className="text-xs text-slate-400">Blocks traversal attacks</div></div><div className="rounded-2xl bg-white p-4 shadow-sm">⚡ <b>One workflow</b><div className="text-xs text-slate-400">Upload → inspect → push</div></div><div className="rounded-2xl bg-white p-4 shadow-sm">🐙 <b>GitHub native</b><div className="text-xs text-slate-400">Commits directly to your repo</div></div></div>
      </section>
    </main>
  );
}
