<template>
  <v-fade-transition @after-leave="onTransitionEnd">
    <div
      v-if="loading"
      ref="headerWelcome"
      key="headerWelcome"
      @animationend="onNoItemsTransitionEnd"
    >
      <home-header-welcome :extra-text="extraText" />
    </div>
    <home-header-items
      v-else-if="show"
      key="headerSwiper"
      :items="items"
      :related-items="relatedItems"
    />
  </v-fade-transition>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapGetters } from 'vuex';
import { BaseItemDto, ImageType, ItemFields } from '@jellyfin/client-axios';

interface ItemId {
  itemId: string;
  relatedItemId: string | undefined;
}

export default Vue.extend({
  props: {
    pages: {
      type: Number,
      default: 10
    }
  },
  data() {
    return {
      ids: [] as ItemId[],
      loading: true,
      show: false,
      extraText: ''
    };
  },
  computed: {
    ...mapGetters('items', ['getItem', 'getItems']),
    items(): BaseItemDto[] {
      return this.getItems(this.ids.map((el) => el.itemId));
    },
    relatedItems(): BaseItemDto[] {
      return this.getItems(this.ids.map((el) => el.relatedItemId));
    }
  },
  async beforeMount() {
    const itemIds = await this.$libraries.fetchLatestMedia({
      limit: this.pages,
      fields: [ItemFields.Overview],
      enableImageTypes: [ImageType.Backdrop, ImageType.Logo],
      imageTypeLimit: 1
    });

    // TODO: Server should include a ParentImageBlurhashes property, so we don't need to do a call
    // for the parent items. Revisit this once proper changes are done.

    this.ids = await Promise.all(
      itemIds.map(async (itemId) => {
        const res: ItemId = { itemId, relatedItemId: undefined };
        const item: BaseItemDto = this.getItem(itemId);

        if (item.Type === 'Episode' && item?.SeriesId) {
          res.relatedItemId = item.SeriesId;
        } else if (item.Type === 'MusicAlbum' && item?.AlbumArtists?.[0]?.Id) {
          res.relatedItemId = item.AlbumArtists[0]?.Id;
        } else if (item?.ParentLogoItemId) {
          res.relatedItemId = item.ParentLogoItemId;
        }

        if (res.relatedItemId) {
          await this.$libraries.fetchItem(res.relatedItemId);
        }

        return res;
      })
    );

    if (this.items.length === 0) {
      this.extraText = this.$t('homeHeader.welcome.noItems');
    } else {
      this.extraText = this.$t('homeHeader.welcome.checkNewItems');
    }
    window.setTimeout(this.hideWelcomeMessage, 1500);
  },
  methods: {
    hideWelcomeMessage(): void {
      if (this.items.length === 0) {
        const elem = this.$refs.headerWelcome as HTMLElement;
        // As the height of the element varies as we're using automatic values, we set first
        // the screen height of the element, so the animation plays correctly when the height is set to 0
        elem.style.maxHeight = elem.scrollHeight + 'px';
        elem.classList.add('no-items');
      } else {
        this.loading = false;
      }
    },
    onNoItemsTransitionEnd(): void {
      this.loading = false;
    },
    onTransitionEnd(): void {
      if (this.items.length !== 0) {
        this.show = !this.loading;
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.no-items {
  overflow: hidden;
  animation-name: slideUp;
  animation-duration: 0.75s;
  animation-fill-mode: forwards;
  animation-iteration-count: 1;
}

@keyframes slideUp {
  to {
    max-height: 0;
    opacity: 0;
  }
}
</style>
