var app = {};
var DATA = DATA || null;

(function() {
  'use strict';

  var Item = Backbone.Model.extend({
    defaults: {
      name: '',
      nameOfZukan: null,
      species: [],
      url: '',
      image: 'http://placehold.it/160/f0f0f0/ccc&text=+'
    },
    initialize: function() {
      if (this.get('nameOfZukan') === null) {
        this.set('nameOfZukan', [this.get('name')]);
      }
    },
    stamp: function(species, url, image) {
      if (!_.contains(this.get('species'), species)) {
        return false;
      }
      this.set({
        url: 'http://zukan.com' + url,
        image: 'http://zukan.com' + image + '?width=160&height=160&type=resize'
      });
      return true;
    },
    wasHunted: function() {
      return !!this.get('url').length;
    }
  });

  var Selection = Backbone.Collection.extend({
    model: Item,
    initialize: function() {
      console.log('All models were loaded.');
    },
    match: function(species, url, image) {
      this.find(function(model) {
        return model.stamp(species, url, image);
      });
    },
    point: function() {
      var hunted = this.filter(function(model) {
        return model.wasHunted();
      });
      console.log(hunted);
      return hunted.length;
    }
  });

  var ItemView = Backbone.View.extend({
    tagName: 'li',
    className: 'pure-u-1-3',
    template: _.template($('#item-template').html()),
    render: function() {
      var that = this;
      var link = _.map(this.model.get('species'), function(num, i) {
        return _.template($('#link-template').html(), {
          id: num,
          name: that.model.get('nameOfZukan')[i]
        });
      });
      this.$el.html(this.template({
        name: this.model.get('name'),
        image: this.model.get('image'),
        link: link.join('')
      }));
      if (this.model.wasHunted()) {
        this.$('.stamp').show();
        console.log(this.$('.stamp').html());
      }
      return this;
    }
  });

  var AppView = Backbone.View.extend({
    el: '#app',
    initialize: function() {
      var that = this;
      this.$('#form').submit(function(e) {
        that.submit();
        return false;
      });
      app.selection = new Selection(_.map(DATA, function(d) {
        return new Item(d);
      }));
      this.render();
    },
    render: function() {
      this.$('#list').html('');
      app.selection.each(function(item) {
        var view = new ItemView({model: item});
        $('#list').append(view.render().el);
      });
    },
    submit: function() {
      var that = this;
      var id = $('#url').val().match(/zukan\.com\/u\/([0-9]+)\//);
      if (_.isArray(id) && id[1] > 0) {
        $('#app').hide();
        $('#loading').show();
        $.ajax({
          url: 'readfile.php?url=http://zukan.com/u/' + id[1] + '/fish/upload',
          data: null,
          dataType: 'text',
          cache: true,
          success: function(data, status, xhr) {
            data = data.match(/<section class="leaf_tile"(.|\n)+?<\/section>/g);
            _.each(data, function(reg) {
              var matchUrl = reg.match(/\/fish\/leaf[0-9]+/);
              var matchImg = reg.match(/\/media\/leaf\/original\/[^?]+/);
              var matchSpc = reg.match(/internal([0-9]+)/);
              if (_.isArray(matchUrl)) {
                var species = parseInt(matchSpc[1], 10);
                app.selection.match(species, matchUrl[0], matchImg[0]);
              }
            });
            that.render();
            $('#point').html(app.selection.point());
            //$('#url').val('');
            $('#loading').hide();
            $('#app').show();
          },
          error: function(xhr, status, e) {
            alert('読み込みに失敗しました');
            $('#loading').hide();
            $('#app').show();
          }
        });
      } else {
        alert('ズカンドットコムのMy図鑑のURLを入力してください');
      }
    }
  });

  new AppView();
})();
