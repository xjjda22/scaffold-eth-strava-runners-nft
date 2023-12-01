import WalletConnectProvider from "@walletconnect/web3-provider";
//import Torus from "@toruslabs/torus-embed"
import WalletLink from "walletlink";
import { Row, Col, Layout, Card, Space, Divider, Radio, Input, Button, Table, Alert, List } from "antd";
import "antd/dist/antd.css";
import React, { useCallback, useEffect, useState } from "react";
// import { BrowserRouter, Link, Route, Switch } from "react-router-dom";
import Web3Modal from "web3modal";
import "./App.css";
import Portis from "@portis/web3";
import Fortmatic from "fortmatic";
import Authereum from "authereum";
import axios from "axios";
import LZ from "lz-string";

import { Account, Contract, Faucet, HeaderSt, ThemeSwitch, StravaActivityMap } from "./components";
import { INFURA_ID, NETWORK, NETWORKS } from "./constants";
import { Transactor } from "./helpers";
import {
  useBalance,
  useContractLoader,
  useContractReader,
  useGasPrice,
  useOnBlock,
  useUserProviderAndSigner,
} from "eth-hooks";
import {
  useEventListener,
} from "eth-hooks/events/useEventListener";
import {
  useExchangeEthPrice,
} from "eth-hooks/dapps/dex";
// import Hints from "./Hints";
// import { ExampleUI, Hints, Subgraph } from "./views";
import { useContractConfig } from "./hooks"

const { ethers } = require("ethers");
const { BufferList } = require("bl");
const ipfsAPI = require("ipfs-http-client");

const { Header, Footer, Content } = Layout;

/// 📡 What chain are your contracts deployed to?
const targetNetwork = NETWORKS.localhost; 
const localProviderUrl = targetNetwork.rpcUrl;

// 😬 Sorry for all the console logging
const DEBUG = true;
const NETWORKCHECK = true;

// 🛰 providers
if (DEBUG) console.log("📡 Connecting to Mainnet Ethereum");

//helper function to "Get" from IPFS
// you usually go content.toString() after this...
const getFromIPFS = async hashToGet => {
  for await (const file of ipfs.get(hashToGet)) {
    console.log(file.path);
    if (!file.content) continue;
    const content = new BufferList();
    for await (const chunk of file.content) {
      content.append(chunk);
    }
    console.log(content);
    return content;
  }
};

const fromWei = i => {
  return i / 10 ** 18;
};
const fromGWei = i => {
  return i / 10 ** 9;
};
const toGWei = i => {
  return i * 10 ** 9;
};
const localProvider = new ethers.providers.StaticJsonRpcProvider(localProviderUrl);
const mainnetInfura = new ethers.providers.StaticJsonRpcProvider("https://mainnet.infura.io/v3/" + INFURA_ID);

// 🔭 block explorer URL
const blockExplorer = targetNetwork.blockExplorer;

// Coinbase walletLink init
const walletLink = new WalletLink({
  appName: "coinbase",
});

// WalletLink provider
const walletLinkProvider = walletLink.makeWeb3Provider(`https://mainnet.infura.io/v3/${INFURA_ID}`, 1);

// Portis ID: 6255fb2b-58c8-433b-a2c9-62098c05ddc9
/*
  Web3 modal helps us "connect" external wallets:
*/
const web3Modal = new Web3Modal({
  network: "mainnet", // Optional. If using WalletConnect on xDai, change network to "xdai" and add RPC info below for xDai chain.
  cacheProvider: true, // optional
  theme: "light", // optional. Change to "dark" for a dark theme.
  providerOptions: {
    walletconnect: {
      package: WalletConnectProvider, // required
      options: {
        bridge: "https://polygon.bridge.walletconnect.org",
        infuraId: INFURA_ID,
        rpc: {
          1: `https://mainnet.infura.io/v3/${INFURA_ID}`, // mainnet // For more WalletConnect providers: https://docs.walletconnect.org/quick-start/dapps/web3-provider#required
          42: `https://kovan.infura.io/v3/${INFURA_ID}`,
          100: "https://dai.poa.network", // xDai
        },
      },

    },
    portis: {
      display: {
        logo: "https://user-images.githubusercontent.com/9419140/128913641-d025bc0c-e059-42de-a57b-422f196867ce.png",
        name: "Portis",
        description: "Connect to Portis App",
      },
      package: Portis,
      options: {
        id: "6255fb2b-58c8-433b-a2c9-62098c05ddc9",
      },
    },
    fortmatic: {
      package: Fortmatic, // required
      options: {
        key: "pk_live_5A7C91B2FC585A17", // required
      },
    },
    // torus: {
    //   package: Torus,
    //   options: {
    //     networkParams: {
    //       host: "https://localhost:8545", // optional
    //       chainId: 1337, // optional
    //       networkId: 1337 // optional
    //     },
    //     config: {
    //       buildEnv: "development" // optional
    //     },
    //   },
    // },
    "custom-walletlink": {
      display: {
        logo: "https://play-lh.googleusercontent.com/PjoJoG27miSglVBXoXrxBSLveV6e3EeBPpNY55aiUUBM9Q1RCETKCOqdOkX2ZydqVf0",
        name: "Coinbase",
        description: "Connect to Coinbase Wallet (not Coinbase App)",
      },
      package: walletLinkProvider,
      connector: async (provider, _options) => {
        await provider.enable();
        return provider;
      },
    },
    authereum: {
      package: Authereum, // required
    },
  },
});

function App(props) {
  const mainnetProvider = mainnetInfura;

  const [injectedProvider, setInjectedProvider] = useState();
  const [address, setAddress] = useState();

  const [gasPrices, setGasPrices] = useState({});
  const [gas, setGas] = useState(0);
  const [gasEth, setGasEth] = useState(0);
  const [gasUsd, setGasUsd] = useState(0);
  const [gasLimit, setGasLimit] = useState(30000);
  const [ethPrice, setEthPrice] = useState(0);

  const [blockNum, setBlockNum] = useState(0);
  const [Loading, setLoading] = useState(0);

  /* 🔥 This hook will get the price of Gas from ⛽️ EtherGasStation */
  const gasPrice = useGasPrice(targetNetwork, "fast");
  
  // Use your injected provider from 🦊 Metamask or if you don't have it then instantly generate a 🔥 burner wallet.
  const userProviderAndSigner = useUserProviderAndSigner(injectedProvider, localProvider);
  const userSigner = userProviderAndSigner.signer;

  // You can warn the user if you would like them to be on a specific network
  const localChainId = localProvider && localProvider._network && localProvider._network.chainId;
  const selectedChainId =
    userSigner && userSigner.provider && userSigner.provider._network && userSigner.provider._network.chainId;

  // For more hooks, check out 🔗eth-hooks at: https://www.npmjs.com/package/eth-hooks

  // The transactor wraps transactions and provides notificiations
  const tx = Transactor(userSigner, gasPrice);

  // Faucet Tx can be used to send funds from the faucet
  const faucetTx = Transactor(localProvider, gasPrice);

  // 🏗 scaffold-eth is full of handy hooks like this one to get your balance:
  const yourLocalBalance = useBalance(localProvider, address);

  const contractConfig = useContractConfig();

  // Load in your local 📝 contract and read a value from it:
  const readContracts = useContractLoader(localProvider, contractConfig);
  const writeContracts = useContractLoader(userSigner, contractConfig, localChainId);

  const mainnetContracts = useContractLoader(mainnetProvider, contractConfig);

  const ethgasAPI = "https://ethgasstation.info/json/ethgasAPI.json";
  const uniswapV2GQL = "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2";
  const ethQL = `{
    bundles (first:1) {
      ethPrice
    }
  }`;

  const getEthPrice = () => {
    axios
      .post(uniswapV2GQL, { query: ethQL })
      .then(response => {
        const { data } = response;
        const {
          data: { bundles },
        } = data;
        if (bundles.length > 0) {
          const ep = parseFloat(bundles[0].ethPrice).toFixed(6);
          setEthPrice(ep);
          calcUsd();
        }
      })
      .catch(error => console.log(error));
  };

  const gasConverter = g => {
    const gm = g * 100000000;
    const gd = parseInt(gm, 10) / 10 ** 9;
    return gd;
  };

  const getGasPrices = () => {
    axios
      .get(ethgasAPI)
      .then(response => {
        const { data } = response;
        const { average, fast, fastest } = data;
        const gasObj = {
          average: gasConverter(average),
          fast: gasConverter(fast),
          fastest: gasConverter(fastest),
        };
        setGasPrices(gasObj);
        setGas(gasObj.fast);
        calcUsd();
      })
      .catch(error => console.log(error));
  };

  const calcUsd = () => {
    if (ethPrice < 0 || gas < 0) return;
    const fg = toGWei(gas);
    const gm = fromWei(fg * gasLimit);
    const u = parseFloat(gm * ethPrice).toFixed(6);
    if (gm > 0) setGasEth(gm);
    if (u > 0) setGasUsd(u);
  };

  const init = () => {
    getEthPrice();
    getGasPrices();
  };

  useOnBlock(mainnetProvider, async () => {
    await setLoading(0);
    // console.log(mainnetProvider)
    const bn = await mainnetProvider._lastBlockNumber;
  
    setBlockNum(bn);

    init();
    await setLoading(1);
  });

  const logoutOfWeb3Modal = async () => {
    await web3Modal.clearCachedProvider();
    if (injectedProvider && injectedProvider.provider && typeof injectedProvider.provider.disconnect == "function") {
      await injectedProvider.provider.disconnect();
    }
    setTimeout(() => {
      window.location.reload();
    }, 1);
  };

  const loadWeb3Modal = useCallback(async () => {
    const provider = await web3Modal.connect();
    setInjectedProvider(new ethers.providers.Web3Provider(provider));

    provider.on("chainChanged", chainId => {
      console.log(`chain changed to ${chainId}! updating providers`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    provider.on("accountsChanged", () => {
      console.log(`account changed!`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    // Subscribe to session disconnection
    provider.on("disconnect", (code, reason) => {
      console.log(code, reason);
      logoutOfWeb3Modal();
    });
  }, [setInjectedProvider]);

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);

  const [route, setRoute] = useState();
  useEffect(() => {
    setRoute(window.location.pathname);
  }, [setRoute]);

  useEffect(() => {
    async function getAddress() {
      if (userSigner) {
        const newAddress = await userSigner.getAddress();
        setAddress(newAddress);
      }
    }
    getAddress();
  }, [userSigner]);

  const faucetAvailable = localProvider 
  && localProvider.connection && targetNetwork.name.indexOf("local") !== -1;

  let networkDisplay = "";
  networkDisplay = (
    <span style={{ 
      zIndex: -1, 
      // position: "absolute", 
      // right: 54, 
      // top: 90, 
      // padding: 5, 
      color: targetNetwork.color 
    }}>
      {targetNetwork.name}
    </span>
  );
  return (
    <div className="App">
      <Layout>
        <Header
          style={{ 
            padding: 0, 
            position: "fixed", 
            zIndex: 1, 
            width: "100%", 
            height: "auto", 
            top: 0 
          }}
        >
          <Row>
          <Col flex="330px">
            <HeaderSt />
          </Col>
          <Col flex="auto">
            <Row>
              <Col flex="auto">
                <Account
                  address={address}
                  localProvider={localProvider}
                  userSigner={userSigner}
                  mainnetProvider={mainnetProvider}
                  // price={price}
                  web3Modal={web3Modal}
                  loadWeb3Modal={loadWeb3Modal}
                  logoutOfWeb3Modal={logoutOfWeb3Modal}
                  // blockExplorer={blockExplorer}
                />
              </Col>
              <Col flex="120px">
                {networkDisplay}
              </Col>
            </Row>
          </Col>
          </Row>
          
        </Header>
        <Content style={{ paddingTop: 150, paddingBottom: 50, width: "100%" }} className="">
          <div
            style={{
              width: "auto",
              // margin: "auto",
              margin: 10,
              padding: 10,
              fontWeight: "bolder",
              borderRadius: 12,
            }}
            class="grad_deeprelief"
          >
            <h3> ⚓ latest block num: {blockNum}</h3>
            <h3> 💲 current eth price: {ethPrice}</h3>
            <h3> ⛽️ selected gas : {gas} gwei</h3>
            <h3> gas limit : {gasLimit}</h3>
            <h3> ♦ gas cost (eth) : {gasEth}</h3>
            <h3> 💲 gas cost (usd) : {gasUsd}</h3>
            <Divider />
            
          </div>

          <div
            style={{
              width: "auto",
              // margin: "auto",
              margin: 10,
              padding: 10,
              fontWeight: "bolder",
              borderRadius: 12,
            }}
            class="grad_deeprelief"
          >
            <div> ****** </div>
            <div style={{ textAlign: "left" }}>
              
            </div>
          </div>
          <StravaActivityMap
            address={address}
            tx={tx}
            provider={userProviderAndSigner}
            writeContracts={writeContracts}
            readContracts={readContracts}
            gas={gas}
            ethPrice={ethPrice}
          />

          
        </Content>
        <Footer
          style={{ padding: 5, position: "fixed", zIndex: 1, width: "100%", bottom: 0 }}
          className="grad_glasswater"
        >
          <Row align="middle" gutter={[4, 4]}>
            <Col span={12}>
            {
              /*  if the local provider has a signer, let's show the faucet:  */
              faucetAvailable ? (
                <Faucet 
                localProvider={localProvider} 
                // price={price} 
                ensProvider={mainnetProvider} 
                />
              ) : (
                ""
              )
            }
            </Col>

            <Col span={12} style={{ textAlign: "center" }}>
              <div style={{ opacity: 0.5 }}>
                {/*<a
                  target="_blank"
                  style={{ color: "#000" }}
                  href="https://github.com/austintgriffith/scaffold-eth"
                >
                  🍴 Repo: Fork me!
                </a>
                <br />*/}
                <a
                  target="_blank"
                  style={{ color: "#000" }}
                  href="https://github.com/xjjda22/scaffold-eth-strava-runners-nft"
                >
                  🍴 Repo: Fork me!
                </a>
              </div>
            </Col>
          </Row>
          {/*<ThemeSwitch />*/}
        </Footer>
      </Layout>
     
            {/*<Contract
              name="YourCollectible"
              signer={userSigner}
              provider={localProvider}
              address={address}
              blockExplorer={blockExplorer}
              contractConfig={contractConfig}
            />*/}
            {/*
            <Contract
              name="UNI"
              customContract={mainnetContracts && mainnetContracts.contracts && mainnetContracts.contracts.UNI}
              signer={userSigner}
              provider={mainnetProvider}
              address={address}
              blockExplorer="https://etherscan.io/"
            />
            */}

      

      {/* 👨‍💼 Your account is in the top right with a wallet at connect options */}
      <div style={{ position: "fixed", textAlign: "right", right: 0, top: 0, padding: 10 }}>
        
      </div>
    </div>
  );
}

export default App;
