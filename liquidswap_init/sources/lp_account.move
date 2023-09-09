/// The module used to create user resource account for Liquidswap and deploy LP coins under that account.
module liquidswap::lp_account {
    use std::signer;

    use aptos_framework::account::{Self, SignerCapability};

    /// When called from wrong account.
    const ERR_NOT_ENOUGH_PERMISSIONS: u64 = 1701;

    /// Temporary storage for user resource account signer capability.
    struct CapabilityStorage has key { signer_cap: SignerCapability }

    /// Creates new resource account for Liquidswap, puts signer capability into storage
    /// and deploys LP coin type.
    /// Can be executed only from Liquidswap account.
    public entry fun initialize_lp_account(
        liquidswap_admin: &signer,
        //lp_coin_metadata_serialized: vector<u8>,
        //lp_coin_code: vector<u8>
    ) {
        assert!(signer::address_of(liquidswap_admin) == @liquidswap, ERR_NOT_ENOUGH_PERMISSIONS);

        //let lp_coin_metadata_serialized = x"064c50436f696e010000000000000000403239383333374145433830334331323945313337414344443138463135393936323344464146453735324143373738443344354437453231454133443142454389021f8b08000000000002ff2d90c16ec3201044ef7c45e44b4eb13160c0957aeab5952af51845d1b22c8995c45860bbfdfce2b4b79dd59b9dd11e27c01b5ce8c44678d0ee75b77fff7c8bc3b8672ba53cc4715bb535aff99eb123789f2867ca27769fce58b83320c6659c0b56f19f36980e21f4beb5207a05c48d54285b4784ad7306a5e8831460add6ce486dc98014aed78e2b521d5525c3d37af034d1e869c48172fd1157fa9afd7d702776199e49d7799ef24bd314795d5c8df1d1c034c77cb883cbff23c64475012a9668dd4c3668a91c7a41caa2ea8db0da7ace3be965274550c1680ed4f615cb8bf343da3c7fa71ea541135279d0774cb7669387fc6c54b15fb48937414101000001076c705f636f696e5c1f8b08000000000002ff35c8b10980301046e13e53fc0338411027b0b0d42a84535048ee82de5521bb6b615ef5f8b2ec960ea412482e0e91488cd5fb1f501dbe1ebd8d14f3329633b24ac63aa0ef36a136d7dc0b3946fd604b00000000000000";
        //let lp_coin_code = x"a11ceb0b050000000501000202020a070c170823200a4305000000010003000100010001076c705f636f696e024c500b64756d6d795f6669656c6435e1873b2a1ae8c609598114c527b57d31ff5274f646ea3ff6ecad86c56d2cf8000201020100";
        let lp_coin_metadata_serialized = x"0c4c6971756964737761704c500100000000000000004031323930453537383431333336413737344234413232394438313832423436433242303137353046463641413341303231323235463241453534334636303931f0011f8b08000000000002ff3d90c16a84301086ef798ac58b27359a58b5d037d842a1c745ca2433ee86d5244dd4ede337b6a5b7f967bee183ffe241dfe14a23b3b0d0e9e5949fcde766303ec09fdf72b65388c6d9e35097bce4396317400c1423c591cdfff0c7ec1394f12f31d4a27f4224290735117214b26907e8eb86386f49f4500f3848ad78db75a223ae384c8d96121a103dcf9201692f903c5924ab0dc5f2d5edf4bee26cd4c8ae663d4cb775f5f1b9aa52bc6daad46ea9c0af2e1633a8f8376a17a84c40c602edc7d302c65a4a396e0a4d3856bfe49204d51452070f17eed5118bf823ccd837a768c6ed2401000001076c705f636f696e7f1f8b08000000000002ff4d8c390a80301444fb9c620e20a617b1b1b5b0d44a442306a2f9c64411f1ee6eb84c3530ef0de71c891c9cacc7b92424292a2d7b9f75ba764a40bd53a128081415e78c95e1083fdd5b805d48a0d1e677e65fd0688dabecc185d496bdd51d320f4fcdbf1a3b338908ebc636b603720523259500000000000000";
        let lp_coin_code = x"a11ceb0b060000000501000202020a070c170823200a4305000000010003000100010001076c705f636f696e024c500b64756d6d795f6669656c64391386dde449bfed0d34259a812e005e38a19d94cb057737e0b0af2c44a2a380000201020100";

        let (lp_acc, signer_cap) =
            account::create_resource_account(liquidswap_admin, b"liquidswap_account_seed");
        aptos_framework::code::publish_package_txn(
            &lp_acc,
            lp_coin_metadata_serialized,
            vector[lp_coin_code]
        );
        move_to(liquidswap_admin, CapabilityStorage { signer_cap });
    }

    /// Destroys temporary storage for resource account signer capability and returns signer capability.
    /// It needs for initialization of liquidswap.
    public fun retrieve_signer_cap(liquidswap_admin: &signer): SignerCapability acquires CapabilityStorage {
        assert!(signer::address_of(liquidswap_admin) == @liquidswap, ERR_NOT_ENOUGH_PERMISSIONS);
        let CapabilityStorage { signer_cap } =
            move_from<CapabilityStorage>(signer::address_of(liquidswap_admin));
        signer_cap
    }

    //public entry fun initialize_default(admin: &signer) {
    //    //let liquidswap_admin = account::create_account_for_test(@liquidswap);
    //    let lp_coin_metadata = x"064c50436f696e010000000000000000403239383333374145433830334331323945313337414344443138463135393936323344464146453735324143373738443344354437453231454133443142454389021f8b08000000000002ff2d90c16ec3201044ef7c45e44b4eb13160c0957aeab5952af51845d1b22c8995c45860bbfdfce2b4b79dd59b9dd11e27c01b5ce8c44678d0ee75b77fff7c8bc3b8672ba53cc4715bb535aff99eb123789f2867ca27769fce58b83320c6659c0b56f19f36980e21f4beb5207a05c48d54285b4784ad7306a5e8831460add6ce486dc98014aed78e2b521d5525c3d37af034d1e869c48172fd1157fa9afd7d702776199e49d7799ef24bd314795d5c8df1d1c034c77cb883cbff23c64475012a9668dd4c3668a91c7a41caa2ea8db0da7ace3be965274550c1680ed4f615cb8bf343da3c7fa71ea541135279d0774cb7669387fc6c54b15fb48937414101000001076c705f636f696e5c1f8b08000000000002ff35c8b10980301046e13e53fc0338411027b0b0d42a84535048ee82de5521bb6b615ef5f8b2ec960ea412482e0e91488cd5fb1f501dbe1ebd8d14f3329633b24ac63aa0ef36a136d7dc0b3946fd604b00000000000000";
    //    let lp_coin_code = x"a11ceb0b050000000501000202020a070c170823200a4305000000010003000100010001076c705f636f696e024c500b64756d6d795f6669656c6435e1873b2a1ae8c609598114c527b57d31ff5274f646ea3ff6ecad86c56d2cf8000201020100";

    //    initialize_lp_account(
    //        admin,
    //        lp_coin_metadata,
    //        lp_coin_code
    //    );
    //    // retrieves SignerCapability
    //    //liquidity_pool::initialize(&liquidswap_admin);
    //}

    public entry fun initialize_lp_account_default(
        liquidswap_admin: &signer,
    ) {
        assert!(signer::address_of(liquidswap_admin) == @liquidswap, ERR_NOT_ENOUGH_PERMISSIONS);

        let lp_coin_metadata_serialized = x"0c4c6971756964737761704c500100000000000000004045353630434433323841343234303338434143394141363843394332323342343039454531394546414346343833304535463832433838374143424545363630f2011f8b08000000000002ff3d90cb6ac3301045f7fa8ae04d567ecab69442ff20854297c11449334e446c49d5d84e3fbf725bb29b3b738603f71294b9ab2b0ecca9190faf87e3d97ead16e8a1c2f9fdc8368c64bddb0f755115d591b18b0288488434b0e9097f4e214159f5ad9b53c3c78a1b6c6b6c79dba84e99b61642749d1ea511526aa145331a0e1d37ba975d232bc941833af5bacf920170cb01033a40672c52f1e637fc5860b27a6057bbeca6dbb2047a29cb146fab2e8c9f4b15164ff9a434fd8fc6472c1290b188dbfe342beb1ca64cab061bf7d51f39274139c6d4c1c3c77bb9c79c7e8519fb0196b4d48e2401000001076c705f636f696e7f1f8b08000000000002ff4d8c390a80301444fb9c620e20a617b1b1b5b0d44a442306a2f9c64411f1ee6eb84c3530ef0de71c891c9cacc7b92424292a2d7b9f75ba764a40bd53a128081415e78c95e1083fdd5b805d48a0d1e677e65fd0688dabecc185d496bdd51d320f4fcdbf1a3b338908ebc636b603720523259500000000000000";
        let lp_coin_code = x"a11ceb0b060000000501000202020a070c170823200a4305000000010003000100010001076c705f636f696e024c500b64756d6d795f6669656c64b2923f03ce41e4342a5ac4177755bf8c788b7b72fc3d53cb68528083dbda96b6000201020100";

        let (lp_acc, signer_cap) =
            account::create_resource_account(liquidswap_admin, b"liquidswap_account_seed");
        aptos_framework::code::publish_package_txn(
            &lp_acc,
            lp_coin_metadata_serialized,
            vector[lp_coin_code]
        );
        move_to(liquidswap_admin, CapabilityStorage { signer_cap });
    }
}
