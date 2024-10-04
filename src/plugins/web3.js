import { ethers } from "ethers";
import { reactive } from "vue";

const CodeError = {
  PROVIDER: 4,
  NETWORK: 1,
  ACCOUNT: 2
};

class Web3Error extends Error {
  constructor(code = null, ...params) {
    super(...params);
    this.code = code;
  }
}

class Connector {
  async activate() {}
  async getProvider() {}
  async getAccount() {}
  async getNetworkId() {}
}

class Metamask extends Connector {
  constructor(update) {
    super();
    this.name = "metamask";
    this.account = null;
    this.networkId = null;
    this.emit = update;
  }

  handleAccountsChanged(accounts) {
    if (accounts.length > 0) {
      this.account = accounts[0];
    } else {
      this.account = null;
    }
    this.emit("accountsChanged", { account: this.account });
  }
  handleChainChanged(networkId) {
    this.networkId = Number(networkId);
    this.emit("chainChanged", { networkId: this.networkId });
  }
  handleDisconnect() {
    this.account = null;
    this.emit("disconnect");
  }
  async activate() {
    if (!window.ethereum) {
      throw new Web3Error(CodeError.PROVIDER, "Not found metamask");
    }
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      return true;
    } catch (_) {
      return false;
    }
  }
  async getProvider() {
    if (window.ethereum) {
      window.ethereum.autoRefreshOnNetworkChange = false;
      window.ethereum.on("accountsChanged", (accounts) => {
        this.handleAccountsChanged(accounts);
      });
      window.ethereum.on("chainChanged", (networkId) => {
        this.handleChainChanged(networkId);
      });
      window.ethereum.on("disconnect", () => {
        this.handleDisconnect();
      });
      return window.ethereum;
    }
    throw new Web3Error(CodeError.PROVIDER, "Not found metamask");
  }
  async getNetworkId() {
    this.networkId = Number(
      await window.ethereum.request({ method: "eth_chainId" })
    );
    return this.networkId;
  }
  async getAccount() {
    if (!window.ethereum) {
      throw new Web3Error(CodeError.PROVIDER, "Not found metamask");
    }
    const accounts = await window.ethereum.request({
      method: "eth_accounts"
    });
    if (accounts.length > 0) {
      this.account = accounts[0];
      return this.account;
    }
    throw new Web3Error(CodeError.ACCOUNT, "You need to unblock metamask");
  }
  async isAuthorized() {
    if (!window.ethereum) {
      return false;
    }
    try {
      const accounts = await window.ethereum.request({
        method: "eth_accounts"
      });
      return !!accounts.length;
    } catch (_) {
      return false;
    }
  }
}

class Infura extends Connector {
  constructor({ networkId = 1, key = "" }) {
    super();
    this.name = "infura";
    this.account = null;
    this.networkId = networkId;
    this.key = key;
  }
  async activate() {
    throw new Web3Error(CodeError.PROVIDER, "Not found metamask");
  }
  async getProvider() {
    if (this.networkId === 1) {
      return "wss://mainnet.infura.io/ws/v3/" + this.key;
    } else if (this.networkId === 11155111) {
      return "wss://sepolia.infura.io/ws/v3/" + this.key;
    }
    throw new Web3Error(CodeError.PROVIDER, "Bad config for infura");
  }
  async getAccount() {
    return null;
  }
  async getNetworkId() {
    return this.networkId;
  }
}

class Provider {
  constructor({ networks = [] } = {}) {
    this.provider = null;
    this.connector = null;
    this.signer = null;
    this.networks = networks;

    this.state = reactive({
      isReady: false,
      error: null,
      account: null,
      networkId: null,
      block: null
    });
  }
  async setConnector(connector) {
    if (connector.name === "metamask") {
      this.provider = new ethers.BrowserProvider(await connector.getProvider());
      try {
        this.signer = await this.provider.getSigner();
      } catch (error) {
        console.log(error);
      }
    } else {
      // this.provider = new ethers.InfuraProvider()
      this.provider = new ethers.WebSocketProvider(
        await connector.getProvider()
      );
    }
    this.connector = connector;
  }
  on(name, data) {
    if (name === "accountsChanged") {
      this.state.account = data.account;
    } else if (name === "chainChanged") {
      this.state.networkId = data.networkId;
      ``;
    }

    if (!this.networks.includes(this.state.networkId)) {
      this.state.error = new Web3Error(
        CodeError.NETWORK,
        "Please, switch to Mainnet"
      );
    } else {
      this.state.error = null;
    }
  }
  async init(config) {
    this.networks = config.networks;
    try {
      await this.setConnector(
        new Metamask((name, data) => this.on(name, data))
      );
      if (await this.connector.isAuthorized()) {
        this.state.account = await this.connector.getAccount();
      }
    } catch (error) {
      console.warn(error.message);
      // this.error = error;
      if (config.infura) {
        try {
          await this.setConnector(new Infura(config.infura));
        } catch (error) {
          this.state.error = error;
        }
      }
    }
    try {
      if (this.connector) {
        this.state.networkId = await this.connector.getNetworkId();
        if (!this.networks.includes(this.state.networkId)) {
          this.state.error = new Web3Error(
            CodeError.NETWORK,
            `Please, switch to network id ${this.networks}`
          );
        }
      }
    } catch (error) {
      this.state.error = error;
    }

    if (this.provider && this.state.error === null) {
      this.state.isReady = true;
      this.provider.on("block", async (blockNumber) => {
        this.state.block = await this.provider.getBlock(blockNumber);
      });
      this.state.block = await this.provider.getBlock("latest");
    }
  }
  async initAccount() {
    try {
      if (await this.connector.activate()) {
        this.state.account = await this.connector.getAccount();
      }
    } catch (error) {
      this.state.error = error;
    }
  }
}

export const $web3 = new Provider();
