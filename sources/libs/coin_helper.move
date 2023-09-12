/// The `CoinHelper` module contains helper funcs to work with `AptosFramework::Coin` module.
module liquidswap::coin_helper {
    use std::option;
    use std::string::{Self, String};


    use aptos_framework::coin;
    use aptos_std::comparator::{Self, Result};
    use aptos_std::type_info;

    use liquidswap::curves::is_stable;
    use liquidswap::math;

    use switchboard::math::unpack;
    use switchboard::aggregator; // For reading aggregators

    // Errors codes.

    /// When both coins have same names and can't be ordered.
    const ERR_CANNOT_BE_THE_SAME_COIN: u64 = 3000;

    /// When provided CoinType is not a coin.
    const ERR_IS_NOT_COIN: u64 = 3001;

    const ERR_EXT_PRICE_CANNOT_BE_NEGATIVE: u64 = 3002;

    const ERR_ORACLE_SCALING_MUST_BE_SAME: u64 = 3003;

    // Constants.
    /// Length of symbol prefix to be used in LP coin symbol.
    const SYMBOL_PREFIX_LENGTH: u64 = 4;

    /// Check if provided generic `CoinType` is a coin.
    public fun assert_is_coin<CoinType>() {
        assert!(coin::is_coin_initialized<CoinType>(), ERR_IS_NOT_COIN);
    }

    /// Compare two coins, `X` and `Y`, using names.
    /// Caller should call this function to determine the order of X, Y.
    public fun compare<X, Y>(): Result {
        let x_info = type_info::type_of<X>();
        let y_info = type_info::type_of<Y>();

        // 1. compare struct_name
        let x_struct_name = type_info::struct_name(&x_info);
        let y_struct_name = type_info::struct_name(&y_info);
        let struct_cmp = comparator::compare(&x_struct_name, &y_struct_name);
        if (!comparator::is_equal(&struct_cmp)) return struct_cmp;

        // 2. if struct names are equal, compare module name
        let x_module_name = type_info::module_name(&x_info);
        let y_module_name = type_info::module_name(&y_info);
        let module_cmp = comparator::compare(&x_module_name, &y_module_name);
        if (!comparator::is_equal(&module_cmp)) return module_cmp;

        // 3. if modules are equal, compare addresses
        let x_address = type_info::account_address(&x_info);
        let y_address = type_info::account_address(&y_info);
        let address_cmp = comparator::compare(&x_address, &y_address);

        address_cmp
    }

    /// Check that coins generics `X`, `Y` are sorted in correct ordering.
    /// X != Y && X.symbol < Y.symbol
    public fun is_sorted<X, Y>(): bool {
        let order = compare<X, Y>();
        assert!(!comparator::is_equal(&order), ERR_CANNOT_BE_THE_SAME_COIN);
        comparator::is_smaller_than(&order)
    }

    /// External Price for pair X/Y scaled up by 1000_000
    public fun oracle_price<X, Y>(): u64 {
        // 2000000
        let (x_oracle_price, x_scaling_factor) = oracle_price_single<X>();
        let (y_oracle_price, y_scaling_factor) = oracle_price_single<Y>();        
        assert!(x_scaling_factor == y_scaling_factor, ERR_ORACLE_SCALING_MUST_BE_SAME);
        // mul_div_u128(x: u128, y: u128, z: u128): u64
        math::mul_div_u128(x_oracle_price, 1000000, y_oracle_price)
    }

    public fun oracle_price_single<X>(): (u128, u8) { //scaled up by 1_000_000_000
        /*
        use switchboard::aggregator; // For reading aggregators
        let (value, scaling_factor, _neg) = math::unpack(aggregator::latest_value(feed_addr)); 
        assert!(_neg == false, ERR_EXT_PRICE_CANNOT_BE_NEGATIVE);
        decimal = value * 10^(-1 * (dec-6)) 
        */
        let feed_addr = @isc_usd_oracle;
        if (type_info::type_name<X>() == string::utf8(b"0xf1f73e02b4db78e95559caa10a3450dd06e19d55f2036f62773fa7f0617b504f::isc_coin::IscCoin")) {
            feed_addr = @isc_usd_oracle;
        } else if (type_info::type_name<X>() == string::utf8(b"0xf1f73e02b4db78e95559caa10a3450dd06e19d55f2036f62773fa7f0617b504f::usd_coin::UsdCoin")) {
            //special case
            return (1000000000, 9)
        } else if (type_info::type_name<X>() == string::utf8(b"0xf1f73e02b4db78e95559caa10a3450dd06e19d55f2036f62773fa7f0617b504f::usdc_coin::UsdcCoin")) {
            feed_addr = @usdc_usd_oracle;
        } else if (type_info::type_name<X>() == string::utf8(b"0xf1f73e02b4db78e95559caa10a3450dd06e19d55f2036f62773fa7f0617b504f::sgd_coin::SgdCoin")) {
            feed_addr = @sgd_usd_oracle;
        } else {
            assert!(false, ERR_IS_NOT_COIN);
        };
        // else if (type_name<X>() == string::utf8(b"0x1::EuroeCoin::euroe_coin")) {
        //     feed_addr = @usd_euroe_oracle;
        // };
        let (value, scaling_factor, _neg) = unpack(aggregator::latest_value(feed_addr)); 
        assert!(_neg == false, ERR_EXT_PRICE_CANNOT_BE_NEGATIVE);
        (value, scaling_factor)
    }

    /// Get supply for `CoinType`.
    /// Would throw error if supply for `CoinType` doesn't exist.
    public fun supply<CoinType>(): u128 {
        option::extract(&mut coin::supply<CoinType>())
    }

    /// Generate LP coin name and symbol for pair `X`/`Y` and curve `Curve`.
    /// ```
    ///
    /// (curve_name, curve_symbol) = when(curve) {
    ///     is Uncorrelated -> (""(no symbol), "-U")
    ///     is Stable -> ("*", "-S")
    /// }
    /// name = "LiquidLP-" + symbol<X>() + "-" + symbol<Y>() + curve_name;
    /// symbol = symbol<X>()[0:4] + "-" + symbol<Y>()[0:4] + curve_symbol;
    /// ```
    /// For example, for `LP<BTC, USDT, Uncorrelated>`,
    /// the result will be `(b"LiquidLP-BTC-USDT+", b"BTC-USDT+")`
    public fun generate_lp_name_and_symbol<X, Y, Curve>(): (String, String) {
        let lp_name = string::utf8(b"");
        string::append_utf8(&mut lp_name, b"LiquidLP-");
        string::append(&mut lp_name, coin::symbol<X>());
        string::append_utf8(&mut lp_name, b"-");
        string::append(&mut lp_name, coin::symbol<Y>());

        let lp_symbol = string::utf8(b"");
        string::append(&mut lp_symbol, coin_symbol_prefix<X>());
        string::append_utf8(&mut lp_symbol, b"-");
        string::append(&mut lp_symbol, coin_symbol_prefix<Y>());

        let (curve_name, curve_symbol) = if (is_stable<Curve>()) (b"-S", b"*") else (b"-U", b"");
        string::append_utf8(&mut lp_name, curve_name);
        string::append_utf8(&mut lp_symbol, curve_symbol);

        (lp_name, lp_symbol)
    }

    fun coin_symbol_prefix<CoinType>(): String {
        let symbol = coin::symbol<CoinType>();
        let prefix_length = math::min_u64(string::length(&symbol), SYMBOL_PREFIX_LENGTH);
        string::sub_string(&symbol, 0, prefix_length)
    }

    #[test(account = @0x1)]
    public entry fun test_oracle(account: &signer) {
        // print out value
        std::debug::print(&aggregator::latest_value(signer::address_of(account)));
    }
}
