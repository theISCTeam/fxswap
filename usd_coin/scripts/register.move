//:!:>usd
script {
    fun register(account: &signer) {
        aptos_framework::managed_coin::register<UsdCoin::usd_coin::UsdCoin>(account)
    }
}
//<:!:usd
