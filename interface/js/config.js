/*
  This is the configuration of the player. Most likely you will
  never have to change anything here, but it is good to be able 
  to, isn't it? 
*/
config = {
    CSS: {
        /* 
          IDs used in the document. The script will get access to 
          the different elements of the player with these IDs, so 
          if you change them in the HTML below, make sure to also 
          change the name here!
        */
        IDs: {
            container: 'eytp-maincontainer',
            canvas: 'eytp-playercanvas',
            player: 'eytp-player',
            controls: 'eytp-controls',

            volumeField: 'eytp-volume',
            volumeBar: 'eytp-volumebar',

            playerForm: 'eytp-playerform',
            urlField: 'eytp-url',

            sizeControl: 'eytp-sizecontrol',

            searchField: 'eytp-searchfield',
            searchForm: 'eytp-search',
            searchOutput: 'eytp-searchoutput'
            /* 
              Notice there should never be a comma after the last 
              entry in the list as otherwise MSIE will throw  a fit!
            */
        },
        /*
          These are the names of the CSS classes, the player adds
          dynamically to the volume bar in certain 
          situations.
        */
        classes: {
            maxvolume: 'maxed',
            disabled: 'disabled'
            /* 
              Notice there should never be a comma after the last 
              entry in the list as otherwise MSIE will throw  a fit!
            */
        }
    },
    /* 
      That is the end of the CSS definitions, from here on 
      you can change settings of the player itself. 
    */
    application: {
        /*
          The YouTube API base URL. This changed during development of this,
          so I thought it useful to make it a parameter.
        */
        youtubeAPI: 'http://gdata.youtube.com/apiplayer/cl.swf',
        /* 
          The YouTube Developer key,
          please replace this with your own when you host the player!!!!!
        */
        devkey: 'AI39si7d...Y9fu_cQ',
        /*
          The volume increase/decrease in percent and the volume message 
          shown in a hidden form field (for screen readers). The $x in the 
          message will be replaced with the real value.
        */
        volumeChange: 10,
        volumeMessage: 'volume $x percent',
        /*
          Amount of search results and the error message should there 
          be no results.
        */
        searchResults: 6,
        loadingMessage: 'Searching, please wait',
        noVideosFoundMessage: 'No videos found : (',
        /*
          Amount of seconds to repeat when the user hits the rewind 
          button.
        */
        secondsToRepeat: 10,
        /*
          Movie dimensions.
        */
        movieWidth: 400,
        movieHeight: 300
        /* 
          Notice there should never be a comma after the last 
          entry in the list as otherwise MSIE will throw  a fit!
        */
    }
}

config = {
    css: {
        ids: {

        },
        classes: {

        }
    },
    application: {
        serviceApi: "https://pcinic-api.glitch.me",
        // serviceApi: "https://alpaca-faucet.herokuapp.com",

        accountServiceApi: "https://ipfs.3box.io",

        contractAddressToken: "0xc571a04f4332093364ce38559f313ba2a766fbb9",
        contractAddressLottery: "0x0Fa233a3b77b881DAC279FE7465fdaF74a88b943"
    },
    messages: {
        faucet_error: "We could not reach the API 😪",
        faucet_fetching: "Processing...",
        faucet_unconnected: "No wallet is connected 😔",

        web3_unconnected: "Connect MetaMask",
        web3_connected: "",
        web3_no_support: "You have to install MetaMask!"
    }
}