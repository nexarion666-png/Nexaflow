import {NextResponse} from 'next/server';
import {Octokit} from 'octokit';
export const runtime='nodejs';
export async function GET(req:Request){
  const token=req.headers.get('authorization')?.replace(/^Bearer\s+/,'');
  if(!token) return NextResponse.json({error:'GitHub token is required.'},{status:401});
  try{
    const gh=new Octokit({auth:token});
    const r=await gh.paginate(gh.rest.repos.listForAuthenticatedUser,{per_page:100,sort:'updated'});
    return NextResponse.json({repos:r.map(x=>({id:x.id,full_name:x.full_name,private:x.private,default_branch:x.default_branch}))});
  }catch(e:any){return NextResponse.json({error:e?.message||'GitHub authentication failed.'},{status:401});}
}
