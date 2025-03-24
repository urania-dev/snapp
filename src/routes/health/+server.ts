import { error, json } from "@sveltejs/kit"

export const fallback = ()=>{
    throw error(405, {message:"METHOD NOT ALLOWED"})
}

export const GET = ()=> json("OK")