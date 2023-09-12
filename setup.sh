coin_owner=0xf1f73e02b4db78e95559caa10a3450dd06e19d55f2036f62773fa7f0617b504f
liquidswap=0xee2610bcc5e690d166ce6c4b7a78c93afca1ebbe5ace4f89baf379fe79e513bb
math_lib=0xe9f81376b8ebbc8a11dd29f11d217cec6859278ce5629ec3156fd38011fa90f1

aptos account fund-with-faucet --account $coin_owner
aptos account fund-with-faucet --account $liquidswap
aptos account fund-with-faucet --account $math_lib

# publish and mint ISC
cd isc_coin
aptos move publish --assume-yes
cd ..
aptos move run \
    --function-id 0x1::managed_coin::register \
    --type-args \
        $coin_owner::isc_coin::IscCoin \
    --assume-yes
aptos move run \
    --function-id 0x1::managed_coin::mint \
    --type-args \
        $coin_owner::isc_coin::IscCoin \
    --args \
        address:$liquidswap \
        u64:1100000000 \
    --profile coin_owner \
    --assume-yes

# publish and mint USD
cd usd_coin
aptos move publish --assume-yes
cd ..
aptos move run \
    --function-id 0x1::managed_coin::register \
    --type-args \
        $coin_owner::usd_coin::UsdCoin \
    --assume-yes
aptos move run \
    --function-id 0x1::managed_coin::mint \
    --type-args \
        $coin_owner::usd_coin::UsdCoin \
    --args \
        address:$liquidswap \
        u64:2100000000 \
    --profile coin_owner \
    --assume-yes

# publish and mint EURE
cd eure_coin
aptos move publish --assume-yes
cd ..
aptos move run \
    --function-id 0x1::managed_coin::register \
    --type-args \
        $coin_owner::eure_coin::EureCoin \
    --assume-yes
aptos move run \
    --function-id 0x1::managed_coin::mint \
    --type-args \
        $coin_owner::eure_coin::EureCoin \
    --args \
        address:$liquidswap \
        u64:1100000000 \
    --profile coin_owner \
    --assume-yes

# publish liquidswap_init
cd liquidswap_init
aptos move publish --assume-yes
aptos move run --function-id 'default::lp_account::initialize_lp_account' --assume-yes
cd ..

# publish math libraries
cd u256
aptos move publish --assume-yes
cd ..
cd uq64x64
aptos move publish --assume-yes
cd ..

# create liquidity pool
aptos move publish --assume-yes
aptos move run \
    --function-id default::liquidity_pool::initialize \
    --assume-yes
#initialize a single pool
aptos move run \
    --function-id default::scripts::register_pool \
    --type-args \
        $coin_owner::isc_coin::IscCoin \
        $coin_owner::usd_coin::UsdCoin \
        $liquidswap::curves::Stable \
    --assume-yes

aptos move run \
    --function-id default::scripts::register_pool \
    --type-args \
        $coin_owner::usd_coin::UsdCoin \
        $coin_owner::eure_coin::EureCoin \
        $liquidswap::curves::Stable \
    --assume-yes

# add liquidity to the pool
aptos move run \
    --function-id default::scripts::add_liquidity \
    --type-args \
        $coin_owner::isc_coin::IscCoin \
        $coin_owner::usd_coin::UsdCoin \
        $liquidswap::curves::Stable \
    --args \
        u64:1000000000\
        u64:10000000\
        u64:1000000000\
        u64:10000000\
    --assume-yes

# add liquidity to the pool
aptos move run \
    --function-id default::scripts::add_liquidity \
    --type-args \
        $coin_owner::usd_coin::UsdCoin \
        $coin_owner::eure_coin::EureCoin \
        $liquidswap::curves::Stable \
    --args \
        u64:1000000000\
        u64:10000000\
        u64:1000000000\
        u64:10000000\
    --assume-yes
