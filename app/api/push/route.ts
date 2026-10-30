import {NextResponse} from 'next/server';
import AdmZip from 'adm-zip';
import {Octokit} from 'octokit';
export const runtime='nodejs';
const MAX=100*1024*1024;
export async function POST(req:Request){
 try{
  const fd=await req.formData(); const f=fd.get('file'); const token=String(fd.get('token')||''); const repo=String(fd.get('repo')||''); const branch=String(fd.get('branch')||'main');
  if(!(f instanceof File)||!token||!repo) return NextResponse.json({error:'ZIP, token, and repository are required.'},{status:400});
  if(f.size>MAX) return NextResponse.json({error:'ZIP exceeds 100 MB limit.'},{status:413});
  const zip=new AdmZip(Buffer.from(await f.arrayBuffer())); const entries=zip.getEntries().filter(e=>!e.isDirectory);
  const files=entries.filter(e=>{const p=e.entryName.replaceAll('\\','/'); return p&&!p.startsWith('/')&&!p.split('/').includes('..')});
  if(files.length!==entries.length) return NextResponse.json({error:'ZIP contains unsafe paths.'},{status:400});
  if(files.length>500) return NextResponse.json({error:'Project contains too many files for this simple uploader (max 500).'}, {status:413});
  const gh=new Octokit({auth:token}); const [owner,name]=repo.split('/');
  if(!owner||!name) return NextResponse.json({error:'Repository must look like owner/name.'},{status:400});
  const ref=await gh.rest.git.getRef({owner,repo:name,ref:`heads/${branch}`});
  const base=await gh.rest.git.getCommit({owner,repo:name,commit_sha:ref.data.object.sha});
  const blobs=[];
  for(const e of files){
    const path=e.entryName.replaceAll('\\','/');
    if(path==='.git'||path.startsWith('.git/')) continue;
    const content=e.getData();
    const b=await gh.rest.git.createBlob({owner,repo:name,content:content.toString('base64'),encoding:'base64'});
    blobs.push({path,mode:'100644' as const,type:'blob' as const,sha:b.data.sha});
  }
  if(!blobs.length) return NextResponse.json({error:'No pushable files found.'},{status:400});
  const tree=await gh.rest.git.createTree({owner,repo:name,base_tree:base.data.tree.sha,tree:blobs});
  const projectName=f.name.replace(/\.zip$/i,'').trim()||'project';
  const commit=await gh.rest.git.createCommit({owner,repo:name,message:`Upload ${projectName}`,tree:tree.data.sha,parents:[base.data.sha]});
  await gh.rest.git.updateRef({owner,repo:name,ref:`heads/${branch}`,sha:commit.data.sha,force:false});
  return NextResponse.json({count:blobs.length,commit:commit.data.sha,url:`https://github.com/${owner}/${name}/commit/${commit.data.sha}`});
 }catch(e:any){return NextResponse.json({error:e?.message||'Push failed.'},{status:500});}
}
