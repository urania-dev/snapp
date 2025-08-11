import { Umami } from "@umami/node";

export const getUmami = (hostUrl:string, websiteId:string, userAgent?:string)=>{
    if(!hostUrl||hostUrl.trim() === '') return
    //~ init
    const umamiClient = new Umami({
        hostUrl, 
        userAgent,
        websiteId
    });
    
 
    return umamiClient
}
