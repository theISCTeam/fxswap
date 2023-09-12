//:!:>eure
module EureCoin::eure_coin {
    struct EureCoin {}

    fun init_module(sender: &signer) {
        aptos_framework::managed_coin::initialize<EureCoin>(
            sender,
            b"Euro E Coin",
            b"EURE",
            6,
            false,
        );
    }
}
//<:!:eure
