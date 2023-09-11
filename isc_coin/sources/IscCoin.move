//:!:>moon
module IscCoin::isc_coin {
    struct IscCoin {}

    fun init_module(sender: &signer) {
        aptos_framework::managed_coin::initialize<IscCoin>(
            sender,
            b"International Stable Currency",
            b"ISC",
            6,
            false,
        );
    }
}
//<:!:moon
