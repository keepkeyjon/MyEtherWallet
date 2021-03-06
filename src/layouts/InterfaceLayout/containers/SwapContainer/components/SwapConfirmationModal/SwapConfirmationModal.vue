<template>
  <div class="modal-container">
    <b-modal
      ref="swapconfirmation"
      hide-footer
      centered
      class="bootstrap-modal bootstrap-modal-wide padding-40-20"
      title="Confirmation"
    >
      <div class="time-remaining">
        <h1>{{ timeRemaining }}</h1>
        <p>{{ $t('interface.timeRemaining') }}</p>
      </div>
      <div class="swap-detail">
        <div class="from-address">
          <div class="icon">
            <i :class="['cc', fromAddress.name, 'cc-icon']" />
          </div>
          <p class="value">
            {{ fromAddress.value }} <span>{{ fromAddress.name }}</span>
          </p>
          <p class="block-title">{{ $t('interface.fromAddr') }}</p>
          <p class="address">{{ fromAddress.address }}</p>
        </div>
        <div class="right-arrow"><img :src="arrowImage" /></div>
        <div class="to-address">
          <div class="icon">
            <i :class="['cc', toAddress.name, 'cc-icon']" />
          </div>
          <p class="value">
            {{ toAddress.value }} <span>{{ toAddress.name }}</span>
          </p>
          <p class="block-title">{{ $t('interface.sendTxToAddr') }}</p>
          <p class="address">{{ toAddress.address }}</p>
        </div>
      </div>

      <div
        :class="[swapReady ? '' : 'disable', 'confirm-send-button']"
        @click="sendTransaction"
      >
        <button-with-qrcode
          :qrcode="qrcode"
          :buttonname="$t('common.continue')"
        />
      </div>

      <help-center-button />
    </b-modal>
  </div>
</template>

<script>
import '@/assets/images/currency/coins/asFont/cryptocoins.css';
import '@/assets/images/currency/coins/asFont/cryptocoins-colors.css';

import BigNumber from 'bignumber.js';
import * as unit from 'ethjs-unit';
import { mapGetters } from 'vuex';

import Arrow from '@/assets/images/etc/single-arrow.svg';
import iconBtc from '@/assets/images/currency/btc.svg';
import iconEth from '@/assets/images/currency/eth.svg';
import ButtonWithQrCode from '@/components/Buttons/ButtonWithQrCode';
import HelpCenterButton from '@/components/Buttons/HelpCenterButton';

import { EthereumTokens, BASE_CURRENCY, ERC20, utils } from '@/partners';
import { WEB3_WALLET } from '@/wallets/bip44/walletTypes';
import { type as noticeTypes } from '@/helpers/notificationFormatters';

export default {
  components: {
    'button-with-qrcode': ButtonWithQrCode,
    'help-center-button': HelpCenterButton
  },
  props: {
    swapDetails: {
      type: Object,
      default: function() {
        return {};
      }
    },
    currentAddress: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      isToken: false,
      preparedSwap: {},
      finalDetails: {},
      swapReady: false,
      currencyIcons: {
        BTC: iconBtc,
        ETH: iconEth
      },
      timeRemaining: 0,
      qrcode: '',
      arrowImage: Arrow,
      fromAddress: {},
      toAddress: {}
    };
  },
  computed: {
    ...mapGetters({
      ens: 'ens',
      gasPrice: 'gasPrice',
      web3: 'web3',
      wallet: 'wallet',
      network: 'network'
    })
  },
  watch: {
    swapDetails(newValue) {
      this.fromAddress = {
        value: newValue.fromValue,
        name: newValue.fromCurrency,
        address: newValue.fromAddress
          ? newValue.fromAddress
          : this.currentAddress
      };
      this.toAddress = {
        value: newValue.toValue,
        name: newValue.toCurrency,
        address: newValue.toAddress
      };
      this.timeUpdater(newValue);
      this.swapStarted(newValue);
    }
  },
  methods: {
    timeUpdater(swapDetails) {
      clearInterval(this.timerInterval);
      this.timeRemaining = utils.getTimeRemainingString(swapDetails.timestamp);
      this.timerInterval = setInterval(() => {
        this.timeRemaining = utils.getTimeRemainingString(
          swapDetails.timestamp
        );
        if (this.timeRemaining === 'expired') {
          clearInterval(this.timerInterval);
        }
      }, 1000);
    },
    async sendTransaction() {
      if (!this.swapReady) return;

      if (
        Array.isArray(this.preparedSwap) ||
        Object.keys(this.preparedSwap).length > 0
      ) {
        if (Array.isArray(this.preparedSwap)) {
          if (this.preparedSwap.length > 1) {
            this.web3.mew
              .sendBatchTransactions(this.preparedSwap)
              .then(_result => {
                let tradeIndex;
                if (this.wallet.identifier === WEB3_WALLET) {
                  tradeIndex = 0;
                } else {
                  tradeIndex = [_result.length - 1];
                }
                _result.map((entry, idx) => {
                  if (idx !== tradeIndex) {
                    entry.catch(err => {
                      // eslint-disable-next-line no-console
                      console.error(err);
                    });
                  }
                });

                _result[tradeIndex]
                  .once('transactionHash', hash => {
                    this.$store.dispatch('addSwapNotification', [
                      noticeTypes.SWAP_HASH,
                      this.currentAddress,
                      this.swapDetails,
                      this.preparedSwap[this.preparedSwap.length - 1],
                      hash
                    ]);
                  })
                  .once('receipt', res => {
                    this.$store.dispatch('addSwapNotification', [
                      noticeTypes.SWAP_RECEIPT,
                      this.currentAddress,
                      this.swapDetails,
                      this.preparedSwap[this.preparedSwap.length - 1],
                      res
                    ]);
                  })
                  .on('error', err => {
                    this.$store.dispatch('addSwapNotification', [
                      noticeTypes.SWAP_ERROR,
                      this.currentAddress,
                      this.swapDetails,
                      this.preparedSwap[this.preparedSwap.length - 1],
                      err
                    ]);
                  })
                  .catch(() => {});
              });
          } else {
            this.web3.eth
              .sendTransaction(this.preparedSwap[0])
              .once('transactionHash', hash => {
                this.$store.dispatch('addSwapNotification', [
                  noticeTypes.SWAP_HASH,
                  this.currentAddress,
                  this.swapDetails,
                  this.preparedSwap[0],
                  hash
                ]);
              })
              .once('receipt', res => {
                this.$store.dispatch('addSwapNotification', [
                  noticeTypes.SWAP_RECEIPT,
                  this.currentAddress,
                  this.swapDetails,
                  this.preparedSwap[0],
                  res
                ]);
              })
              .on('error', err => {
                this.$store.dispatch('addSwapNotification', [
                  noticeTypes.SWAP_ERROR,
                  this.currentAddress,
                  this.swapDetails,
                  this.preparedSwap[0],
                  err
                ]);
              });
          }
        } else {
          this.web3.eth
            .sendTransaction(this.preparedSwap)
            .once('transactionHash', hash => {
              this.$store.dispatch('addSwapNotification', [
                noticeTypes.SWAP_HASH,
                this.currentAddress,
                this.swapDetails,
                this.preparedSwap,
                hash
              ]);
            })
            .once('receipt', res => {
              this.$store.dispatch('addSwapNotification', [
                noticeTypes.SWAP_RECEIPT,
                this.currentAddress,
                this.swapDetails,
                this.preparedSwap,
                res
              ]);
            })
            .on('error', err => {
              this.$store.dispatch('addSwapNotification', [
                noticeTypes.SWAP_ERROR,
                this.currentAddress,
                this.swapDetails,
                this.preparedSwap,
                err
              ]);
            });
        }
        this.$emit('swapStarted', [this.currentAddress, this.swapDetails]);
        this.$refs.swapconfirmation.hide();
      }
    },
    async swapStarted(swapDetails) {
      this.timeUpdater(swapDetails);
      this.swapReady = false;
      this.preparedSwap = {};
      if (
        swapDetails.dataForInitialization &&
        !Array.isArray(swapDetails.dataForInitialization)
      ) {
        if (
          swapDetails.maybeToken &&
          swapDetails.fromCurrency !== BASE_CURRENCY
        ) {
          const tokenInfo = EthereumTokens[swapDetails.fromCurrency];
          if (!tokenInfo) throw Error('Selected Token not known to MEW Swap');
          this.preparedSwap = {
            from: this.wallet.getChecksumAddressString(),
            to: tokenInfo.contractAddress,
            value: 0,
            data: new this.web3.eth.Contract(
              ERC20,
              tokenInfo.contractAddress
            ).methods
              .transfer(
                swapDetails.providerAddress,
                new BigNumber(swapDetails.fromValue)
                  .times(new BigNumber(10).pow(tokenInfo.decimals))
                  .toFixed()
              )
              .encodeABI()
          };
        } else if (
          swapDetails.maybeToken &&
          swapDetails.fromCurrency === BASE_CURRENCY
        ) {
          this.preparedSwap = {
            from: this.wallet.getChecksumAddressString(),
            to: swapDetails.providerAddress,
            value: unit.toWei(swapDetails.providerReceives, 'ether')
          };
        }
      } else {
        this.preparedSwap = swapDetails.dataForInitialization.map(entry => {
          entry.from = this.wallet.getChecksumAddressString();
          if (
            +unit.toWei(this.gasPrice, 'gwei').toString() >
            +swapDetails.kyberMaxGas
          ) {
            entry.gasPrice = swapDetails.kyberMaxGas;
          }
          return entry;
        });
      }
      this.swapReady = true;
    }
  }
};
</script>

<style lang="scss" scoped>
@import 'SwapConfirmationModal.scss';
</style>
