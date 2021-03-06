import Vue from 'vue';
import { shallowMount } from '@vue/test-utils';
import AddressBlock from '@/containers/ConfirmationContainer/components/AddressBlock/AddressBlock.vue';
import web3 from 'web3';
import { Tooling } from '@@/helpers';

function capitalize(value) {
  if (!value) return '';
  value = value.toString();
  return value.charAt(0).toUpperCase() + value.slice(1);
}

describe('AddressBlock.vue', () => {
  let localVue, i18n, wrapper, store;
  const address = 'address';
  const direction = 'from';
  const currency = 'ETH';
  const tokenTransferTo = 'tokenTransferTo';
  const tokenSymbol = 'tokenSymbol';
  const tokenTransferVal = '100';
  const value = '1000000000000';
  beforeAll(() => {
    const baseSetup = Tooling.createLocalVueInstance();
    localVue = baseSetup.localVue;
    i18n = baseSetup.i18n;
    store = baseSetup.store;
    Vue.config.errorHandler = () => {};
    Vue.config.warnHandler = () => {};
  });

  beforeEach(() => {
    wrapper = shallowMount(AddressBlock, {
      localVue,
      i18n,
      store,
      attachToDocument: true,
      propsData: {
        address,
        direction,
        currency,
        tokenTransferTo,
        tokenSymbol,
        tokenTransferVal,
        value
      }
    });
  });

  xit('[FAILING] should render correct address props', () => {
    wrapper.setProps({ tokenTransferTo: '' });
    expect(wrapper.vm.$el.querySelector('.address').textContent.trim()).toEqual(
      address
    );
  });

  xit('[FAILING] should render correct direction props', () => {
    expect(
      wrapper.vm.$el.querySelector('.identicon-container p').textContent.trim()
    ).toEqual(capitalize(direction) + ' Address');
  });

  xit('[FAILING] should render correct currency props', () => {
    wrapper.setProps({ tokenSymbol: '' });
    expect(
      wrapper.vm.$el.querySelector('.currency-type').textContent.trim()
    ).toEqual(currency.toUpperCase());
  });

  xit('[FAILING] should render correct tokenTransferVal props', () => {
    expect(
      wrapper.vm.$el.querySelector('.currency-amt').textContent.trim()
    ).toEqual('- ' + tokenTransferVal);
  });

  xit('[FAILING] should render correct tokenTransferTo props', () => {
    expect(wrapper.vm.$el.querySelector('.address').textContent.trim()).toEqual(
      tokenTransferTo
    );
  });

  xit('[FAILING] should render correct tokenSymbol props', () => {
    expect(
      wrapper.vm.$el.querySelector('.currency-type').textContent.trim()
    ).toEqual(tokenSymbol);
  });

  xit('[FAILING] should render correct value props', () => {
    wrapper.setProps({ tokenTransferVal: '' });
    const eth = web3.utils.fromWei(value, 'ether');
    expect(
      wrapper.vm.$el.querySelector('.currency-amt').textContent.trim()
    ).toEqual('- ' + eth);
  });

  describe('AddressBlock.vue Methods', () => {});
});
