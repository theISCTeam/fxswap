//:!:>isc
script {
    fun register(account: &signer) {
        aptos_framework::managed_coin::register<IscCoin::isc_coin::IscCoin>(account)
    }
}
//<:!:isc
