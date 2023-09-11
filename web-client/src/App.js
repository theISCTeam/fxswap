import './App.css';
import { Layout, Row, Col, FloatButton, Button, Card, Input, Dropdown, Space, message } from "antd";
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import { Provider, Network } from "aptos";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useState, useEffect } from "react";
import {  SwapOutlined  } from "@ant-design/icons";
import DropdownButton from 'antd/es/dropdown/dropdown-button';
import { DownOutlined, SmileOutlined } from '@ant-design/icons';

const provider = new Provider(Network.LOCAL);
const provider2 = new Provider(Network.MAINNET);
// change this to be your module account address
const coin_owner="0xf1f73e02b4db78e95559caa10a3450dd06e19d55f2036f62773fa7f0617b504f";
const liquidswap="0xee2610bcc5e690d166ce6c4b7a78c93afca1ebbe5ace4f89baf379fe79e513bb";
const POOLS={
  "ISCUSD": "ISC-USD",
  "SGDUSD": "SGD-USD",
}
const COINS={
  "APT": "APT",
  "ISC": "ISC",
  "USD": "USD",
  "SGD": "SGD",
}
const POOL_COINS={
  "ISC-USD": [COINS.ISC, COINS.USD],
  "SGD-USD": [COINS.SGD, COINS.USD],
}
const COIN_ADDR={
  "APT": `0x1::aptos_coin::AptosCoin`,
  "ISC": `${coin_owner}::isc_coin::IscCoin`,
  "USD": `${coin_owner}::usd_coin::UsdCoin`,
  "SGD": `${coin_owner}::usd_coin::UsdCoin`,
}
const COIN_RESOURCE_ADDR={
  "APT": `0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>`,
  "ISC": `0x1::coin::CoinStore<${coin_owner}::isc_coin::IscCoin>`,
  "USD": `0x1::coin::CoinStore<${coin_owner}::usd_coin::UsdCoin>`,
  "SGD": `0x1::coin::CoinStore<${coin_owner}::usd_coin::UsdCoin>`,
}
const COIN_PRICE_ADDR={
  "APT": `0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>`,
  "ISC": `0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>`,
  "USD": `0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>`,
  "SGD": `0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>`,
}

function App() {
  const { account, signAndSubmitTransaction } = useWallet();
  const [balanceApt, setBalanceApt] = useState(0);
  const [balanceIsc, setBalanceIsc] = useState(0);
  const [balanceUsd, setBalanceUsd] = useState(0);
  const [balanceSgd, setBalanceSgd] = useState(0);
  const [inputAmount, setInputAmount] = useState(0);
  const [outputAmount, setOutputAmount] = useState(0);
  const [swapOrder, setSwapOrder] = useState([COINS.USD, COINS.ISC]);
  const [prices, setPrices] = useState({APT:1, ISC:1, USD:1, SGD:1});
  const [currentPool, setCurrentPool] = useState(POOLS.ISCUSD);

  const coinToString = (coin) => {
    return coin;
  }

  const getCoinAddress = (coin) => {
    return COIN_ADDR[coin];
  }

  const getCoinResourceAddress = (coin) => {
    return COIN_RESOURCE_ADDR[coin];
  }

  const getCoinPriceAddress = (coin) => {
    return COIN_PRICE_ADDR[coin];
  }

  const computeOutputAmount = () => {
    const price0 = prices[swapOrder[0]]
    const price1 = prices[swapOrder[1]]
    const output_amount = inputAmount*(price0/price1)
    console.log("output amt computed")
    return output_amount
  }

  const fetchBalance = async (coin) => {
    if (!account) return [];
    try {
      let resource = getCoinResourceAddress(coin);
      const CoinStore = await provider.getAccountResource(
        account.address,
        resource
      );
      let balance = CoinStore.data.coin.value/1000000;
      if (coin==COINS.APT) setBalance(coin, balance/100);
      else setBalance(coin, balance);
    } catch (e) {
    }
  };

  const fetchPrice = async (coin) => {
    if (!account) return [];
    try {
      let resource = getCoinPriceAddress(coin);
      const CoinStore = await provider.getAccountResource(
        account.address,
        resource
      );
      let balance = CoinStore.data.coin.value/1000000;
      let temp=prices
      temp[coin] = balance
      setPrices(temp);
    } catch (e) {
    }
  };

  useEffect(() => { fetchBalance(COINS.APT); }, [account?.address]);
  useEffect(() => { fetchBalance(COINS.ISC); }, [account?.address]);
  useEffect(() => { fetchBalance(COINS.USD); }, [account?.address]);
  useEffect(() => { fetchBalance(COINS.SGD); }, [account?.address]);
  useEffect(() => { fetchPrice(COINS.APT); }, [account?.address]);
  useEffect(() => { fetchPrice(COINS.ISC); }, [account?.address]);
  useEffect(() => { fetchPrice(COINS.USD); }, [account?.address]);
  useEffect(() => { fetchPrice(COINS.SGD); }, [account?.address]);

  const setBalance = (coin, value) => {
    switch (coin) {
      case COINS.APT:
        setBalanceApt(value);
        break;
      case COINS.ISC:
        setBalanceIsc(value);
        break;
      case COINS.USD:
        setBalanceUsd(value);
        break;
      case COINS.SGD:
        setBalanceSgd(value);
        break;
    }
  }

  const updateAmount = async (e) => {
    setInputAmount(e.target.value);
  };

  const changeSwapOrder = async (e) => {
    setSwapOrder([swapOrder[1], swapOrder[0]])
  };

  const performSwap = async () => {
    if (!account) return [];
    // build a transaction payload to be submited
    const payload = {
      type: "entry_function_payload",
      function: `${liquidswap}::scripts::swap`,
      type_arguments: [
        getCoinAddress(swapOrder[0]),
        getCoinAddress(swapOrder[1]),
        `${liquidswap}::curves::Stable`,
      ],
      arguments: [parseInt(inputAmount)*1000000, 5],
    };
    try {
      // sign and submit transaction to chain
      const response = await signAndSubmitTransaction(payload);
      // wait for transaction
      await provider.waitForTransaction(response.hash);
    } catch (error) {
    }
  };

  const items = [
    {
      key: POOLS.ISCUSD,
      label: ( POOLS.ISCUSD),
    },
    {
      key: POOLS.SGDUSD,
      label: ( POOLS.SGDUSD),
      disabled: false,
    },
  ];

  const onClick = ({ key }) => {
    setCurrentPool(key)
    let a=POOL_COINS[key]
    setSwapOrder(a)
    console.log(a)
  };

  return (
    <div style= {{backgroundColor: '#000000', height:'100vh'}}>
      <Layout>
        <Row align="middle" style={{backgroundColor: '#222222'}}>
          <Col span={10} offset={2}>
            <h1 style={{color: '#dddddd'}}>FxSwap</h1>
          </Col>
          <Col span={12} style={{ textAlign: "right", paddingRight: "100px" }}>
            <WalletSelector style={{color:'#333333'}}/>
          </Col>
        </Row>
      </Layout>
      <Row gutter={[0, 32]} style={{ marginTop: "2rem"}}>
        <Col offset={10}>
          <Card title="Stable Swap" style={{minWidth:'350px'}}>
            <Input addonAfter={<div style={{width:"30px", maxWidth:"30px"}}>{coinToString(swapOrder[0])}</div>} onChange={updateAmount}/>
            <div style={{'display': 'flex', 'flexDirection': 'column',
                          'alignItems': 'center',
                          'textAlign:': 'center'
            }}>
              <Button shape="circle" size="small" icon={<SwapOutlined rotate="90" onClick={changeSwapOrder}/>} flex="center"/>
            </div>
            <Input style={{}} disabled={true} value={computeOutputAmount()} addonAfter={<div style={{width:"30px", maxWidth:"30px"}}>{coinToString(swapOrder[1])}</div>} />
            <br /> <br />
            <div style={{display: 'flex', justifyContent:'space-between'}}>
              <span>
                <div style={{marginTop:'5px'}}>
              Select Liquidity Pool
                </div>
              </span>
              <span>
              <Dropdown menu={{ items, onClick, }}  style={{marginRight:'0', marginLeft:'auto'}}>
                <Button>
                <a onClick={(e) => e.preventDefault()}>
                  <Space>
                    {currentPool}
                    <DownOutlined />
                  </Space>
                </a>
                </Button>
              </Dropdown>
              </span>
            </div>
            <br />
            <Button onClick={performSwap} block type="primary" /*style={{ height: "40px", backgroundColor: "#3f67ff" }}*/>
              Swap
            </Button>

          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default App;
