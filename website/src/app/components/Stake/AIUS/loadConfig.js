import config_sepolia from "../../../../sepolia_config.json"
import config_arbitrum_one from "../../../../arbitrum_one_config.json"

const loadConfig = () =>{

    if(process?.env?.NEXT_PUBLIC_AIUS_ENV === "dev"){
        return config_sepolia;
    }else{
        return config_arbitrum_one;
    }
    
}

export default loadConfig;