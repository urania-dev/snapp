import { json } from "@sveltejs/kit";
import { createOpenApiSpec, } from "@uraniadev/sveltekit-valibot-openapi";
import { m } from "$lib/paraglide/messages";
import { getHost } from "$lib/remotes/config.remote";

export const GET = async ()=>{
	const host = await getHost() 
  const module = import.meta.glob("/src/routes/api/**/+server.{ts,js}")
  const spec = await createOpenApiSpec(module,
    {
      basePath: "/api",
      info: {
      description: m.api_app_description(),
      title: "Snapp",
      version: "1.0.0",
    },
    logger:{
      error:console.error,
      warn:console.warn,
      
    },
    security: [{ bearerAuth: [] }],
    securitySchemes: {
      bearerAuth: {
        bearerFormat: "JWT",
        scheme: "bearer",
        type: "http",
      },
    },
    servers: [
      { description: "Production", url: host.origin },
    ],
  }
)
  return json(spec)
};

