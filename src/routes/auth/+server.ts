import { redirect } from "@sveltejs/kit"

export const GET = ()=>{
    redirect(302,'/auth/sign-in')
}