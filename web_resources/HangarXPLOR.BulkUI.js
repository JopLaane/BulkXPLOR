
var HangarXPLOR = HangarXPLOR || {};

HangarXPLOR.BulkEnabled = true;

HangarXPLOR._callbacks = HangarXPLOR._callbacks || {};

HangarXPLOR._callbacks.Gift = function (e) {
    window.alert('Coming Soon')
}

HangarXPLOR._callbacks.GiftConfirm = function (e) { window.alert('Coming Soon') }

HangarXPLOR._callbacks.Melt = function (e) {
    e.preventDefault();
    window.Main.closeModal();

    var data = {
        item_price: '$' + HangarXPLOR._selectedMelt.toLocaleString('en-US', { minimumFractionDigits: 2 }),
        item_name: HangarXPLOR._meltable.length + ' Ships',
        items: HangarXPLOR._meltable,
    };

    HangarXPLOR.BulkUI.modal = new RSI.Lightbox({
        content: window.Main.renderTemplate("#tpl_reclaim_bulk", data),
        class_name: 'modals',
        noclose_btn: true
    });

    HangarXPLOR.BulkUI.modal.holder.find(".panes").css({ left: '-535px' });

    $(document).on('submit', 'form[name=reclaim-bulk]', HangarXPLOR._callbacks.MeltConfirm);

    HangarXPLOR.BulkUI.modal.fadeIn(300);
}

HangarXPLOR._callbacks.MeltConfirm = function (e) {
    e.preventDefault();
    var totalCallbacks = HangarXPLOR._selected.length;
    var totalSuccess = 0;
    var totalError = 0;
    var totalMelt = 0;
    var melted = '';
    var errors = '';

    $('#reclaim .panes').hide();
    $('#reclaim form[name=reclaim-bulk]').css({'overflow':'auto', "max-height":"500px"});

    meltNext();

    function meltNext() {
        var pledge = HangarXPLOR._selected[totalCallbacks - 1];
        
        $.ajax({
            url: '/api/account/reclaimPledge',
            method: 'POST',
            data: {
                current_password: $('input[name=current_password]', HangarXPLOR.BulkUI.modal.holder).val(),
                pledge_id: pledge.pledge_id
            },
            headers: { 'X-Rsi-Token': $.cookie('Rsi-Token') },
            success: function (result) {
                if (result.success) {
                    totalSuccess++;
                    totalMelt += pledge.melt_value;
                    
                    console.log(`Succesfull melted ${pledge.pledge_name}. %cAdded ${pledge.melt_value} to your ledger!`, "color:green; font-size:16px");
                    melted += '<li>' + pledge.pledge_name + ' - ' + pledge.melt_value + '</li>';
                    
                } else {
                    totalError++;
                    errors += '<li>' + pledge.pledge_name + ' - ' + result.msg + '</li>';
                    console.log(`Failed to melt ${pledge.pledge_name} (${pledge.pledge_id}) for the following reason:\n%c${result.msg}`, "color:red; font-size:16px");
                }

                if (--totalCallbacks > 0) {
                    setTimeout(function () { meltNext(); }, 3000);
                } else {
                    setTimeout(function () { document.location.reload() }, 5000);
                }

                if (totalSuccess > 0) {
                    $('#reclaim .js-success-message').html("Your Store ledger was credited with <strong>$" + totalMelt.toLocaleString('en-US', { minimumFractionDigits: 2 }) + "</strong>" + '<ul>' + melted + '</ul>').fadeIn(300);
                }

                if (totalError > 0) {
                    $('#reclaim .js-error-message').html('There were errors completing your request. <ul>' + errors + '</ul>').fadeIn(300);
                } else {
                    $('#reclaim .js-error-message').hide();
                }

                HangarXPLOR.BulkUI.modal.resizeCurrent();
            }
        });
    }
}

