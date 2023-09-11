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
const switchboard_resource=`0x7d7e436f0b2aafde60774efb26ccc432cf881b677aca7faaf2a01879bd19fb8::aggregator::AggregatorRound<0x7d7e436f0b2aafde60774efb26ccc432cf881b677aca7faaf2a01879bd19fb8::aggregator::CurrentRound>`
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
  "APT": `0xb8f20223af69dcbc33d29e8555e46d031915fc38cb1a4fff5d5167a1e08e8367`,
  "ISC": `0x585c73812e22794f74cdd1c25c5942e688312a3d6eaf8bd98ae995fe7def40a0`,
  "USD": `0xdc1045b4d9fd1f4221fc2f91b2090d88483ba9745f29cf2d96574611204659a5`,
  "SGD": `0x7424f85045d526fc1d3feb3a2a289bf6a65ee750825a94d0b4f2026be72a1759`,
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
    try {
      let account = getCoinPriceAddress(coin);
      const CoinStore = await provider2.getAccountResource(
        account,
        switchboard_resource
      );
      let price = CoinStore.data.result.value/(10**CoinStore.data.result.dec)
      let temp=prices
      if (coin==COINS.SGD) {
        price = 1/price;
      }
      temp[coin] = price
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
            <Input style={{}} disabled={false} value={computeOutputAmount()} addonAfter={<div style={{width:"30px", maxWidth:"30px"}}>{coinToString(swapOrder[1])}</div>} />
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
