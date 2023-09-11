

aptos move run \
    --function-id $ace_addr::cli_args::set_vals \
    --type-args \
        0x1::account::Account \
        0x1::chain_id::ChainId \
    --args \
        u8:123 \
        "bool:[false, true, false, false]" \
        'address:[["0xace", "0xbee"], ["0xcad"], []]' \
    --private-key-file ace.key \
    --assume-yes


owner=0xf1f73e02b4db78e95559caa10a3450dd06e19d55f2036f62773fa7f0617b504f
dummy_acc=0x0673f426183e670ca4dc574cce05205798dc20a36342ae5133a909ce2382a6d2

aptos move run \
    --function-id 0x1::managed_coin::register \
    --type-args \
        $owner::isc_coin::IscCoin \
    --assume-yes

aptos move run \
    --function-id 0x1::managed_coin::register \
    --type-args \
        $owner::usd_coin::UsdCoin \
    --assume-yes

aptos move run \
    --function-id 0x1::managed_coin::register \
    --type-args \
        '0x1::managed_coin::Capabilities<0xf1f73e02b4db78e95559caa10a3450dd06e19d55f2036f62773fa7f0617b504f::isc_coin::IscCoin>' \
    --assume-yes


aptos move run \
    --function-id 0x1::managed_coin::mint \
    --type-args \
        $owner::isc_coin::IscCoin \
    --args \
        address:$owner \
        u64:1000000000 \
    --assume-yes

aptos move run \
    --function-id 0x1::coin::transfer \
    --type-args \
        $owner::isc_coin::IscCoin \
    --args \
        address:$dummy_acc \
        u64:10000 \
    --assume-yes

aptos move run \
    --function-id 0x1::managed_coin::mint \
    --type-args \
        $owner::usd_coin::UsdCoin \
    --args \
        address:$owner \
        u64:1000000000 \
    --assume-yes

coin_owner=0xf1f73e02b4db78e95559caa10a3450dd06e19d55f2036f62773fa7f0617b504f
liquidswap=0xee2610bcc5e690d166ce6c4b7a78c93afca1ebbe5ace4f89baf379fe79e513bb

aptos move run \
    --function-id 

aptos move run \
    --function-id default::liquidity_pool::initialize \
    --assume-yes

aptos move run \
    --function-id default::scripts::register_pool \
    --type-args \
        $coin_owner::isc_coin::IscCoin \
        $coin_owner::usd_coin::UsdCoin \
        $liquidswap::curves::Stable \
    --assume-yes

aptos move run \
    --function-id default::scripts::swap \
    --type-args \
        $coin_owner::usd_coin::UsdCoin \
        $coin_owner::isc_coin::IscCoin \
        $liquidswap::curves::Stable \
    --args \
        u64:100000000 \
        u64:5 \
    --profile coin_owner \
    --assume-yes




