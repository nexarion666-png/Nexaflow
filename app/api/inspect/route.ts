import { NextResponse } from 'next/server';
import AdmZip from 'adm-zip';

export const runtime='nodejs';
const MAX=100*1024*1024;
export async function POST(req:Request){
  try {
    const fd=await req.formData(); const f=fd.get('file');
    if(!(f instanceof File)) return NextResponse.json({error:'ZIP file is required.'},{status:400});
    if(f.size>MAX) return NextResponse.json({error:'ZIP exceeds 100 MB limit.'},{status:413});
    const buf=Buffer.from(await f.arrayBuffer()); const zip=new AdmZip(buf);
    const entries=zip.getEntries();
    const files=entries.filter(e=>!e.isDirectory).map(e=>({path:e.entryName.replaceAll('\\','/'),size:e.header.size}));
    for(const x of files){
      if(x.path.startsWith('/')||x.path.includes('../')||x.path.split('/').includes('..')) return NextResponse.json({error:`Unsafe path: ${x.path}`},{status:400});
    }
    return NextResponse.json({files});
  } catch { return NextResponse.json({error:'Invalid or unreadable ZIP file.'},{status:400}); }
}
