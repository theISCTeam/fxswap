//:!:>usd
module UsdCoin::usd_coin {
    struct UsdCoin {}

    fun init_module(sender: &signer) {
        aptos_framework::managed_coin::initialize<UsdCoin>(
            sender,
            b"USD Coin",
            b"USD",
            6,
            false,
        );
    }
}
//<:!:usd
