import './App.css';
import { Layout, Row, Col, Button, Card, Input } from "antd";
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import { Provider, Network } from "aptos";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useState, useEffect } from "react";

const provider = new Provider(Network.LOCAL);
// change this to be your module account address
const coin_owner="0xf1f73e02b4db78e95559caa10a3450dd06e19d55f2036f62773fa7f0617b504f";
const liquidswap="0xee2610bcc5e690d166ce6c4b7a78c93afca1ebbe5ace4f89baf379fe79e513bb";

function App() {
  const { account, signAndSubmitTransaction } = useWallet();
  const [balanceApt, setBalanceApt] = useState(0);
  const [balanceIsc, setBalanceIsc] = useState(0);
  const [balanceUsd, setBalanceUsd] = useState(0);
  const [inputAmount, setInputAmount] = useState(0);

  useEffect(() => { fetchBalance('APT'); }, [account?.address]);
  useEffect(() => { fetchBalance('ISC'); }, [account?.address]);
  useEffect(() => { fetchBalance('USD'); }, [account?.address]);

  const fetchBalance = async (coin) => {
    if (!account) return [];
    try {
      let resource = `0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>`;
      if (coin=='ISC') {resource = `0x1::coin::CoinStore<${coin_owner}::isc_coin::IscCoin>`}
      if (coin=='USD') {resource = `0x1::coin::CoinStore<${coin_owner}::usd_coin::UsdCoin>`}
      const CoinStore = await provider.getAccountResource(
        account.address,
        resource
      );
      let balance = CoinStore.data.coin.value/1000000;
      if (coin=='APT') setBalanceApt(balance/100);
      if (coin=='ISC') setBalanceIsc(balance);
      if (coin=='USD') setBalanceUsd(balance);
    } catch (e) {
    }
  };

  const updateAmount = async (e) => {
    setInputAmount(e.target.value);
  };

  const performSwap = async () => {
    if (!account) return [];
    // build a transaction payload to be submited
    const payload = {
      type: "entry_function_payload",
      function: `${liquidswap}::scripts::swap`,
      type_arguments: [
        `${coin_owner}::usd_coin::UsdCoin`,
        `${coin_owner}::isc_coin::IscCoin`,
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

  return (
    <>
      <Layout>
        <Row align="middle">
          <Col span={10} offset={2}>
            <h1>FxSwap</h1>
          </Col>
          <Col span={12} style={{ textAlign: "right", paddingRight: "200px" }}>
            <WalletSelector />
          </Col>
        </Row>
      </Layout>
      <Row gutter={[0, 32]} style={{ marginTop: "2rem" }}>
        <Col span={4} offset={10}>
          <Card title="Stable Swap">
            <Input prefix="I" suffix="ISC" onChange={updateAmount}/>
            <br />
            <br />
            <Input prefix="$" suffix="USD" />
            <br />
            <br />
            <Button onClick={performSwap} block type="primary" /*style={{ height: "40px", backgroundColor: "#3f67ff" }}*/>
              Swap
            </Button>

          </Card>
        </Col>
      </Row>
    </>
  );
}

export default App;
