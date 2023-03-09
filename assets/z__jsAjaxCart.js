/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
window.PXUTheme.jsAjaxCart = {
  init: function ($section) {
    // Add settings from schema to current object
    window.PXUTheme.jsAjaxCart = $.extend(this, window.PXUTheme.getSectionData($section));

    if (isScreenSizeLarge() || this.cart_action == 'drawer') {
      this.initializeAjaxCart();
    } else {
      this.initializeAjaxCartOnMobile();
    }

    if (this.cart_action == 'drawer') {

      this.ajaxCartDrawer = $('[data-ajax-cart-drawer]');

      $(document).on('click', '[data-ajax-cart-trigger]', function (e) {
        e.preventDefault();
        window.PXUTheme.jsAjaxCart.showDrawer();

        return false;
      });

    } else if (this.cart_action == 'mini_cart') {
      this.showMiniCartOnHover();
    }

    $(document).on('click', '.ajax-submit', function (e) {
      e.preventDefault();
      const $addToCartForm = $(this).closest('form');
      window.PXUTheme.jsAjaxCart.addToCart($addToCartForm);

      return false;
    });

    $(document).on('click', '[data-ajax-cart-delete]', function (e) {
      e.preventDefault();
      var lineID = $(this).parents('[data-line-item]').data('line-item');
      console.log(lineID);
      shouldRemoveLineID = lineID;
      var remove_need_products_array = [];
      $.ajax({
        dataType: "json",
        async: false,
        cache: false,
        url: "/cart",
        success: function (response) {
          console.log(response);
          response.items.forEach((item, index) => {
            // console.log(item.properties._io_order_group);
            if ( item.properties ){ //if customizable product
              console.log(item.properties);
              if (item.properties._io_order_group && (index+1) == lineID){ // if main customizable product
                shouldRemoveLineID = item.properties._io_order_group;
                remove_amount = 1;
                remove_need_products_array.push(item.variant_id);
              }
              if ( shouldRemoveLineID == item.properties._io_parent_order_group ){
                remove_amount = remove_amount + 1;
                remove_need_products_array.push(item.variant_id);
              }
            }
          })
          // console.log(remove_amount, remove_need_products_array);
          if ( remove_need_products_array.length > 0 ){
            for ( i = 0; i < remove_need_products_array.length; i++ ){          
              if (i==0){
                data_for_update_js = "updates[" + remove_need_products_array[i] + "]=" + 0;
              }else{
                data_for_update_js = data_for_update_js + "&" + "updates[" + remove_need_products_array[i] + "]=" + 0;
              }          
            }
            // console.log(data_for_update_js);
            $.ajax({
              type: 'POST',
              url: '/cart/update.js',
              data: data_for_update_js,
              dataType: 'json',
              success: function (cart) {
                window.PXUTheme.jsAjaxCart.updateView();
              },
              error: function (XMLHttpRequest, textStatus) {
                var response = eval('(' + XMLHttpRequest.responseText + ')');
                response = response.description;      
              }
            });
          }else{
            window.PXUTheme.jsAjaxCart.removeFromCart(lineID);

            if (window.PXUTheme.jsCart) {
              window.PXUTheme.jsCart.removeFromCart(lineID);
            }

            return false;
          }          
        }
      });
      
    });

    $(document).on('click', '[data-ajax-cart-close]', function (e) {
      e.preventDefault();
      window.PXUTheme.jsAjaxCart.hideDrawer();
      window.PXUTheme.jsAjaxCart.hideMiniCart();

      return false;
    });

  },
  showMiniCartOnHover: function () {
    const $el = $('[data-ajax-cart-trigger]');

    $el.hover(function() {
      if(window.PXUTheme.theme_settings.header_layout == 'centered' && $('.header-sticky-wrapper').hasClass('is-sticky')) {
        $('.header-sticky-wrapper [data-ajax-cart-trigger]').addClass('show-mini-cart');
      } else {
        $el.addClass('show-mini-cart');
      }
    }, function() {
      $el.removeClass('show-mini-cart');
    });
  },
  hideMiniCart: function () {
    if (this.cart_action != 'mini_cart') return false;
    const $el = $('[data-ajax-cart-close]').parents('[data-ajax-cart-trigger]');
    $el.removeClass('show-mini-cart');
  },
  toggleMiniCart: function() {
    const $el = $('.mobile-header [data-ajax-cart-trigger]');

    // Removes url to the cart page so user is not redirected
    $el.attr('href', '#');

    $el.off('touchstart').on('touchstart', function (e) {
      // If user clicks inside the element, do nothing
      if (e.target.closest('[data-ajax-cart-mini_cart]')) {
        return;
      }

      // Loads content into ajaxCart container for mobile header
      window.PXUTheme.jsAjaxCart.initializeAjaxCartOnMobile();

      // If user clicks outside the element, toggle the mini cart
      $el.toggleClass('show-mini-cart');
    });
  },
  showDrawer: function () {
    if (this.cart_action != 'drawer') return false;
    this.ajaxCartDrawer.addClass('is-visible');
    $('.ajax-cart__overlay').addClass('is-visible');
  },
  hideDrawer: function () {
    if (this.cart_action != 'drawer') return false;
    this.ajaxCartDrawer.removeClass('is-visible');
    $('.ajax-cart__overlay').removeClass('is-visible');
  },
  removeFromCart: function (lineID, callback) {    
    $.ajax({
      type: 'POST',
      url: '/cart/change.js',
      data: 'quantity=0&line=' + lineID,
      dataType: 'json',
      success: function (cart) {        
        window.PXUTheme.jsAjaxCart.updateView();
      },
      error: function (XMLHttpRequest, textStatus) {
        var response = eval('(' + XMLHttpRequest.responseText + ')');
        response = response.description;

      }
    });    
  },
  initializeAjaxCart: function () {

    window.PXUTheme.asyncView.load(
      window.PXUTheme.routes.cart_url, // template name
      'ajax', // view name (suffix)
    )
      .done(({ html, options }) => {

        $('[data-ajax-cart-content]').html(html.content);

        // Converting the currencies
        if (window.PXUTheme.currencyConverter) {
          window.PXUTheme.currencyConverter.convertCurrencies();
        }

      })
      .fail(() => {
        // some error handling
      });
  },
  initializeAjaxCartOnMobile: function () {

    this.toggleMiniCart();

    window.PXUTheme.asyncView.load(
      window.PXUTheme.routes.cart_url, // template name
      'ajax', // view name (suffix)
    )
      .done(({ html, options }) => {

        $('.mobile-header [data-ajax-cart-content]').html(html.content);

      })
      .fail(() => {
        // some error handling
      });
  },
  addToCart: function ($addToCartForm) {
    const $addToCartBtn = $addToCartForm.find('.button--add-to-cart');

    $addToCartForm.removeClass('shopify-product-form--unselected-error');

    if ($addToCartBtn[0].hasAttribute('data-options-unselected')) {
      const cartWarning = `<p class="cart-warning__message animated bounceIn">${window.PXUTheme.translation.select_variant}</p>`;

      $('.warning').remove();

      $addToCartForm
        .addClass('shopify-product-form--unselected-error')
        .find('.cart-warning')
        .html(cartWarning);

      $addToCartBtn
        .removeAttr('disabled')
        .removeClass('disabled');

      $addToCartBtn.find('.icon')
        .removeClass('zoomOut')
        .addClass('zoomIn');

      $addToCartBtn
        .find('span:not(.icon)')
        .text($addToCartBtn.data('label'))
        .removeClass('zoomOut')
        .addClass('zoomIn');
    } else {
      $.ajax({
        url: '/cart/add.js',
        dataType: 'json',
        cache: false,
        type: 'post',
        data: $addToCartForm.serialize(),
        beforeSend: function () {
          $addToCartBtn
            .attr('disabled', 'disabled')
            .addClass('disabled');

          $addToCartBtn.find('span')
            .removeClass("fadeInDown")
            .addClass('animated zoomOut');
        },
        success: function (product) {

          let $el = $('[data-ajax-cart-trigger]');

          $addToCartBtn
            .find('.checkmark')
            .addClass('checkmark-active');

          function addedToCart() {

            if (!isScreenSizeLarge()) {
              $el = $('.mobile-header [data-ajax-cart-trigger]');
              window.PXUTheme.scrollToTop($el);
            } else {
              $el = $('[data-ajax-cart-trigger]');
            }

            $el.addClass('show-mini-cart');

            $addToCartBtn.find('span')
              .removeClass('fadeInDown');
          }

          window.setTimeout(function () {
            $addToCartBtn
              .removeAttr('disabled')
              .removeClass('disabled');

            $addToCartBtn.find('.checkmark')
              .removeClass('checkmark-active');

            $addToCartBtn.find('.text, .icon')
              .removeClass('zoomOut')
              .addClass('fadeInDown');

            $addToCartBtn.on('webkitAnimationEnd oanimationend msAnimationEnd animationend', addedToCart);

          }, 1000);

          var group_number;
          var should_be_changed_quantity;
          var main_product_id, data_for_update_js, upcharge_group_parent_number;
          var update_need_products_array = [];
          var main_product_array=[];
          var upcharge_product_array=[];
          fetch('/cart.js')        
          .then((response) => {
            return response.json();
          })
          .then((response) => {
            response.items.forEach((item) => {          
              //getting main product id and composition count
              if (item.properties){
                if (item.properties._io_order_group){
                  // main_product_object.id = item.variant_id;
                  group_number = item.properties._io_order_group;
                  if ( item["properties"]["Composition for RH"] ){
                    should_be_changed_quantity = item["properties"]["Composition for RH"].split(",").length;
                  }else if( item["properties"]["Composition for LH"] ){
                    should_be_changed_quantity = item["properties"]["Composition for LH"].split(",").length;
                  }else{
                    should_be_changed_quantity = 1;
                  }
                  // main_product_object.quantity = should_be_changed_quantity;
                  main_product_id = parseInt(item.variant_id); //main product id
                  if ( update_need_products_array.includes(main_product_id) == false ){
                    update_need_products_array.push(main_product_id); //adding main product id to the array list
                  }
                  var main_product_update_data = "updates[" + main_product_id + "]=" + should_be_changed_quantity;
                  main_product_array.push(main_product_update_data);
                  // console.log("updated quantities is " + should_be_changed_quantity + "main id is "+ update_need_products_array);
                }
              }  
              // console.log("main product array is " + main_product_array);
              //end getting main product id and composition count
              
              //getting upcharge product id and pushing it to the array
              if (item.properties){
                if (item.properties._io_parent_order_group){
                  // if ( upcharge_product_array.includes(item.variant_id) == false ){
                  //   upcharge_product_array.push(item.variant_id);
                  // }
                  let upcharge_product_id = parseInt(item.variant_id);
                  upcharge_group_parent_number = item.properties._io_parent_order_group;
                  if ( upcharge_group_parent_number == group_number && update_need_products_array.includes(upcharge_product_id) == false ){
                    update_need_products_array.push(upcharge_product_id);
                  }
                  var upcharge_product_update_data = "updates[" + upcharge_product_id + "]=" + should_be_changed_quantity;
                  upcharge_product_array.push(upcharge_product_update_data);
                }
              }
              //end getting upcharge product id and pushing it to the array              
            });
            // console.log("upcharge product array is " + upcharge_product_array);
            setTimeout(function(){
              var final_array = main_product_array.concat(upcharge_product_array);
              var data_for_update_js = final_array.join('&');
              console.log(data_for_update_js);
              $.ajax({
                type: 'POST',
                url: '/cart/update.js',
                data: data_for_update_js,
                dataType: 'json',
                success: function (cart) {
                  window.PXUTheme.jsAjaxCart.updateView();
                },
                error: function (XMLHttpRequest, textStatus) {
                  var response = eval('(' + XMLHttpRequest.responseText + ')');
                  response = response.description;      
                }
              });
            }, 1000)
            return false;     
          })
          .catch((e) => {
            console.error(e);
          });

          window.PXUTheme.jsAjaxCart.showDrawer();
          window.PXUTheme.jsAjaxCart.updateView();

          if (window.PXUTheme.jsCart) {
            $.ajax({
              dataType: "json",
              async: false,
              cache: false,
              dataType: 'html',
              url: "/cart",
              success: function (html) {
                const cartForm = $(html).find('.cart__form');
                $('.cart__form').replaceWith(cartForm);
                
              }
            });
          }

        },
        error: function (XMLHttpRequest) {
          let response = eval('(' + XMLHttpRequest.responseText + ')');
          response = response.description;

          const cartWarning = `<p class="cart-warning__message animated bounceIn">${response.replace('All 1 ', 'All ')}</p>`;

          $('.warning').remove();

          $addToCartForm
            .find('.cart-warning')
            .html(cartWarning);

          $addToCartBtn
            .removeAttr('disabled')
            .removeClass('disabled');

          $addToCartBtn.find('.icon')
            .removeClass('zoomOut')
            .addClass('zoomIn');

          $addToCartBtn
            .find('span:not(.icon)')
            .text($addToCartBtn.data('label'))
            .removeClass('zoomOut')
            .addClass('zoomIn');
        }
      });
    }
  },
  updateView: function () {

    window.PXUTheme.asyncView.load(
      window.PXUTheme.routes.cart_url, // template name
      'ajax', // view name (suffix)
    )
    .done(({ html, options }) => {

      if (options.item_count > 0) {
        const itemList = $(html.content).find('.ajax-cart__list');
        const cartDetails = $(html.content).find('.ajax-cart__details-wrapper');

        $('.ajax-cart__list').replaceWith(itemList);
        $('.ajax-cart__details-wrapper').replaceWith(cartDetails);
        $('.ajax-cart__empty-cart-message').addClass('is-hidden');
        $('.ajax-cart__form').removeClass('is-hidden');
        $('[data-ajax-cart-trigger]').addClass('has-cart-count');
        $('[data-bind="itemCount"]').text(options.item_count);

      } else {
        $('.ajax-cart__empty-cart-message').removeClass('is-hidden');
        $('.ajax-cart__form').addClass('is-hidden');
        $('[data-ajax-cart-trigger]').removeClass('has-cart-count');
        $('[data-bind="itemCount"]').text('0');
      }

      if (window.PXUTheme.currencyConverter) {
        window.PXUTheme.currencyConverter.convertCurrencies();
      }
    })
    .fail(() => {
      // some error handling
    });
  },
  unload: function ($section) {

    // Clear event listeners in theme editor
    $('.ajax-submit').off();
    $('[data-ajax-cart-delete]').off();
  }
}

/******/ })()
;