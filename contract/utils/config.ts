import { config as dotenvConfig } from "dotenv";
dotenvConfig();

interface IConfig {
  etherscan: {
    api_key: string;
  },
  mainnet: {
    provider_url: string;
    private_key: string;
  };
  goerli: {
    provider_url: string;
    private_key: string;
  };
  sepolia: {
    provider_url: string;
    private_key: string;
  };
  arbgoerli: {
    provider_url: string;
    private_key: string;
  };
  nova: {
    provider_url: string;
    private_key: string;
  };
}

export const getEnv = (key: string, defaultValue?: any) => {
  const value = process.env[key];
  if (!value) {
    if (defaultValue === undefined || defaultValue === null) {
      throw new Error(`Required env var ${key} not set`);
    } else {
      return defaultValue;
    }
  }
  if (value.toLocaleLowerCase() === "false") {
    return false;
  }
  if (value.toLocaleLowerCase() === "true") {
    return true;
  }
  return value;
};

export const envconfig: IConfig = {
  etherscan: {
    api_key: getEnv("ETHERSCAN_API_KEY", ""),
  },
  mainnet: {
    provider_url: getEnv("MAINNET_PROVIDER_URL", ""),
    private_key:  getEnv("MAINNET_PRIVATE_KEY", ""),
  },
  goerli: {
    provider_url: getEnv("GOERLI_PROVIDER_URL", ""),
    private_key:  getEnv("GOERLI_PRIVATE_KEY", ""),
  },
  sepolia: {
    provider_url: getEnv("SEPOLIA_PROVIDER_URL", ""),
    private_key:  getEnv("SEPOLIA_PRIVATE_KEY", ""),
  },
  arbgoerli: {
    provider_url: getEnv("ARBGOERLI_PROVIDER_URL", ""),
    private_key:  getEnv("ARBGOERLI_PRIVATE_KEY", ""),
  },
  nova: {
    provider_url: getEnv("NOVA_PROVIDER_URL", ""),
    private_key:  getEnv("NOVA_PRIVATE_KEY", ""),
  },
};
