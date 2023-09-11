coin_owner=0xf1f73e02b4db78e95559caa10a3450dd06e19d55f2036f62773fa7f0617b504f
liquidswap=0xee2610bcc5e690d166ce6c4b7a78c93afca1ebbe5ace4f89baf379fe79e513bb
math_lib=0xe9f81376b8ebbc8a11dd29f11d217cec6859278ce5629ec3156fd38011fa90f1

aptos move run \
    --function-id default::scripts::swap \
    --type-args \
        $coin_owner::isc_coin::IscCoin \
        $coin_owner::usd_coin::UsdCoin \
        $liquidswap::curves::Stable \
    --args \
        u64:1000000 \
        u64:5 \
    --assume-yes
    #--profile coin_owner \

