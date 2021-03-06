Vue.directive('sortable', {
  inserted: function (el, binding) {
    new Sortable(el, binding.value || {})
  }
})

var itemListMixin = {
    data: function(){
        return this.getInitData();
    },
    methods: {
        getInitData: function(){
            data = {
                url: '',
                itemsLoaded: false,
                items: {
                    results: [],
                    count: 0
                },
                params: {},
            }
            return data;
        },
        resetDefaults: function(overrides){
            if(!overrides) overrides = {}
            var data = Object.assign(this.getInitData(), overrides);
            Object.assign(this.$data, data);
        },
        get: function(){
            var vm = this;
            if(!vm.url) return
            $.get(vm.url, vm.getParams(), function(res){
                vm.items = res
                vm.itemsLoaded = true;
            });
        },
        getParams: function(){
            return this.params
        }
    },
}

var paginationMixin = {
    data: function(){
        return {
            params: {
                page: 1,
            },
            itemsPerPage: djaodjinSettings.itemsPerPage,
        }
    },
    computed: {
        totalItems: function(){
            return this.items.count
        },
        pageCount: function(){
            return Math.ceil(this.totalItems / this.itemsPerPage)
        }
    }
}

if($('#rules-table').length > 0){
var rtable = new Vue({
    el: "#rules-table",
    data: function(){
        return {
            url: djaodjinSettings.urls.rules.api_rules,
            itemsLoaded: false,
            items: {
                results: [],
                count: 0
            },
            params: {},
            ruleModalOpen: false,
            newRule: {
                path: '',
                rank: 0,
                is_forward: false,
            },
            edit_description: [],
        }
    },
    mixins: [
        itemListMixin,
        paginationMixin,
    ],
    methods: {
        moved: function(e){
            var vm = this;
            // updating local order
            vm.items.results.splice(e.newIndex, 0,
                vm.items.results.splice(e.oldIndex, 1)[0]);
            var pos = [{oldpos: e.oldIndex+1, newpos: e.newIndex+1}];
            $.ajax({
                method: 'PATCH',
                url: vm.url,
                contentType: 'application/json',
                data: JSON.stringify(pos),
            }).done(function (resp) {
                vm.items = resp;
            }).fail(function(resp){
                showErrorMessages(resp);
            });
        },
        create: function(){
            var vm = this;
            $.ajax({
                method: 'POST',
                url: vm.url,
                contentType: 'application/json',
                data: JSON.stringify(vm.newRule),
            }).done(function (resp) {
                vm.get();
                vm.newRule = {
                    path: '',
                    rank: 0,
                    is_forward: false,
                }
                vm.ruleModalOpen = false;
            }).fail(function(resp){
                vm.ruleModalOpen = false;
                showErrorMessages(resp);
            });
        },
        update: function(rule){
            var vm = this;
            var url = vm.url + rule.path;
            $.ajax({
                method: 'PUT',
                url: url,
                contentType: 'application/json',
                data: JSON.stringify(rule),
            }).done(function (resp) {
                vm.ruleModalOpen = false;
            }).fail(function(resp){
                vm.ruleModalOpen = false;
                showErrorMessages(resp);
            });
        },
        remove: function(idx){
            var vm = this;
            var rule = vm.items.results[idx]
            var url = vm.url + rule.path;
            $.ajax({
                method: 'DELETE',
                url: url,
            }).done(function (resp) {
                vm.params.page = 1;
                vm.get();
            }).fail(function(resp){
                showErrorMessages(resp);
            });
        },
        editDescription: function(idx){
            var vm = this;
            vm.edit_description = Array.apply(
                null, new Array(vm.items.results.length)).map(function() {
                return false;
            });
            vm.$set(vm.edit_description, idx, true)
            // at this point the input is rendered and visible
            vm.$nextTick(function(){
                vm.$refs.edit_description_input[idx].focus();
            });
        },
        saveDescription: function(coupon, idx, event){
            if (event.which === 13 || event.type === "blur" ){
                this.$set(this.edit_description, idx, false)
                this.update(this.items.results[idx])
            }
        },
    },
    mounted: function(){
        this.get();
    }
});
}

if($('#rule-list-container').length > 0){
var app = new Vue({
    el: "#rule-list-container",
    data: {
        itemsLoaded: false,
        items: {
            results: [],
            count: 0
        },

        modalOpen: false,
        sessionKey: 'Generating...',
        testUsername: '',
        forward_session: '',
        forward_session_header: '',
        forward_url: '',
    },
    methods: {
        submitEntryPoint: function(){
            var vm = this;
            var data = {
                entry_point: vm.$refs.entryPoint.value,
                session_backend: vm.$refs.sessionBackend.value,
            }
            $.ajax({
                method: 'PUT',
                url: djaodjinSettings.urls.rules.api_detail,
                contentType: 'application/json',
                data: JSON.stringify(data),
            }).done(function (resp) {
                showMessages(["Update successful."], "success");
            }).fail(function(resp){
                showErrorMessages(resp);
            });
        },
        getSessionData: function(){
            var vm = this;
            var url = djaodjinSettings.urls.rules.api_session_data + "/" + vm.testUsername;
            $.ajax({
                method: 'GET',
                url: url,
            }).done(function(resp) {
                vm.forward_session = resp.forward_session;
                vm.forward_session_header = resp.forward_session_header;
                vm.forward_url = resp.forward_url;
            }).fail(function(resp){
                showErrorMessages(resp);
            });
        },
        openKeyModal: function(){
            this.generateKey();
            this.modalOpen = true;
        },
        generateKey: function(){
            var vm = this;
            $.ajax({
                method: 'PUT',
                url: djaodjinSettings.urls.rules.api_generate_key,
            }).done(function (resp) {
                vm.sessionKey = resp.enc_key;
            }).fail(function(resp){
                vm.sessionKey = "ERROR";
                showErrorMessages(resp);
            });
        },
    },
})
}
