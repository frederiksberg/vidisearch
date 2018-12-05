

// let settings = {
//     "async": true,
//     "crossDomain": true,
//     "url": "data.json",
//     //"url": "http://distribution.virk.dk/cvr-permanent/virksomhed/_search",
//     "method": "GET",
//     "headers": {
//         "Content-Type": "application/json",
//         "Authorization": "Basic RnJlZGVyaWtzYmVyZ19Lb21tdW5lX0NWUl9JX1NLWUVOOmZlNzAxNjJhLWMwZmQtNGI3Ni1hMzY2LWJkYTdlYTU5NmJhZA==",
//         "cache-control": "no-cache",
//         "Postman-Token": "277573e1-0a38-4f79-b03b-a9ce7257b352"
//     },
//     "processData": false,
//     "data": query
// }

// let getAddrID = function (address) {
//     return $.getJSON("http://dawa.aws.dk/datavask/adresser?betegnelse=" + address).then(data => {
//         // for stor usikkerhed med adresser i kat: C
//         if (data.kategori == "C") {
//             console.log("kunne ikke finde adresse");
//         } else {
//             return data.resultater[0].aktueladresse.id;
//         }

//     })
// }

// //tager nyesteBeliggenhedsadresse og laver adressestreng
// let CVRaddress = function (addr) {

//     let vej = addr.vejnavn
//     let husnr = addr.husnummerFra
//     let litra = addr.bogstavFra
//     let etage = addr.etage
//     let sidedoer = addr.sidedoer
//     let postnr = addr.postnummer
//     let by = addr.postdistrikt

//     address = `${vej} ${husnr}${litra} ${etage} ${sidedoer}, ${postnr} ${by}`

//     return address
// }

// let getGeometryFromID = function (addrID) {
//     return $.getJSON("http://dawa.aws.dk/adresser/" + addrID)
// }

// let getGeometryFromAddress = function (addr) {
//     address = CVRaddress(addr)
//     getAddrID(address).then(function (data) {
//         getGeometryFromID(data).then(function (addr) {
//             console.log(addr.adgangsadresse.adgangspunkt.koordinater)
//         })
//     })
// }

// $.ajax(settings).done(function (res) {
//     //console.log(res);
//     res.hits.hits.forEach(element => {

//         let addr = element._source.Vrvirksomhed.virksomhedMetadata.nyesteBeliggenhedsadresse

//         if (addr.adresseId !== undefined) {
//             getGeometryFromID(addr.adresseId).done(function (res) {
//                 console.log(res.adgangsadresse.adgangspunkt.koordinater)
//             })
//         } else {
//             getGeometryFromAddress(addr)
//         }
//     });
// });

//getAdrID('smalle gade 1 2000')

'use strict';

import SvgIcon from '@material-ui/core/SvgIcon';

/**
 * @type {*|exports|module.exports}
 */
var React = require('react');;

var cloud;

var layerGroup = L.layerGroup();

var utils;

var mapObj;

var exId = "planSearch";

var config = require('../../../../config/config.js');

var mainSearch;


function BuildingIcon(props) {
    return <SvgIcon {...props}>
        <path d="M11 17h2v-1h1c.55 0 1-.45 1-1v-3c0-.55-.45-1-1-1h-3v-1h4V8h-2V7h-2v1h-1c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1h3v1H9v2h2v1zm9-13H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4V6h16v12z" />
    </SvgIcon>
}

module.exports = {
    set: function (o) {
        cloud = o.cloud;
        utils = o.utils;
        mapObj = cloud.get().map;
        mainSearch = o.extensions.vidisearch.index;

        mainSearch.registerSearcher({
            key: 'Cvr',
            obj: { 'searcher': this, 'title': 'Cvr', 'icon': <BuildingIcon /> }
        });
    },

    init: function () {

    },

    search: function (searchTerm) {

        let request = {
            url: "/api/extension/vidisearch/cvr?searchTerm=" + searchTerm,
            type: "GET"
        }

        return new Promise((resolve, reject) => {
            $.ajax(request).done(function (res) {

                res = JSON.parse(res);

                let results = res.hits.hits.map((item, index) => {

                    let gotProertyAntalAnsatte = item._source.Vrvirksomhed.virksomhedMetadata.nyesteKvartalsbeskaeftigelse !== null
                    let antalAnsatte;

                    if (gotProertyAntalAnsatte) {
                        let split = item._source.Vrvirksomhed.virksomhedMetadata.nyesteKvartalsbeskaeftigelse.intervalKodeAntalAnsatte.split('_')
                        antalAnsatte = `${split[1] - split[2]}`
                    } else {
                        antalAnsatte = 'ingen data'
                    }


                    return {
                        name: item._source.Vrvirksomhed.virksomhedMetadata.nyesteNavn.navn,
                        id: item._source.Vrvirksomhed.virksomhedMetadata.nyesteBeliggenhedsadresse.adresseId,
                        addresse: CVRaddress(item._source.Vrvirksomhed.virksomhedMetadata.nyesteBeliggenhedsadresse),
                        branche: item._source.Vrvirksomhed.virksomhedMetadata.nyesteHovedbranche.branchetekst,
                        virksomhedform: item._source.Vrvirksomhed.virksomhedMetadata.nyesteVirksomhedsform.langBeskrivelse,
                        antalAnsatte: antalAnsatte,
                        startDato: item._source.Vrvirksomhed.virksomhedMetadata.stiftelsesDato 
                    }
                })

                resolve({ 'type': 'Cvr', icon: <BuildingIcon />, results: results });
            });
        })

    },

    handleSearch: function (item, setCaretPosition) {

        return new Promise(function (resolve, reject) {


            if (item.id === null) {
                getAddrID(item.addresse).then(function (data) {
                    getGeometryFromID(data).then(function (addr) {
                        resultFunc(item, addr, resolve);
                    })
                })
            } else {
                $.getJSON("http://dawa.aws.dk/adresser/" + item.id).done((res) => {
                    resultFunc(item, res, resolve)
                });
            }

        })
    },





}

let resultFunc = function (item, resultData, resolve) {
    
    let coords = resultData.adgangsadresse.adgangspunkt.koordinater;
    coords = [coords[1], coords[0]];
    mapObj.eachLayer(function (layer) {
        if (layer instanceof L.Marker) {
            mapObj.removeLayer(layer);
        }
    });
    var marker = L.marker(coords).addTo(mapObj);
    mapObj.setView(coords, 17);


    let component =
        <div>
            <div>Navn: {item.name}</div>
            <div>Branche: {item.branche} </div>
            <div>virksomhedform: {item.virksomhedform} </div>
            <div>Antal Ansatte (kvatal): {item.antalAnsatte} </div>
            <div>Ejendoms Nr: {resultData.adgangsadresse.esrejendomsnr}</div>
            <div>Matrikel Nr: {resultData.adgangsadresse.jordstykke.matrikelnr}</div>
            <div>Start Dato: {item.startDato}</div>
        </div>

    resolve({ component: component, newQuery: item.name, showSearcher:false });

}


//tager nyesteBeliggenhedsadresse og laver adressestreng
let CVRaddress = function (addr) {

    let vej = addr.vejnavn !== null ? addr.vejnavn : ''
    let husnr = addr.husnummerFra !== null ? addr.husnummerFra : ''
    let litra = addr.bogstavFra !== null ? addr.bogstavFra : ''
    let postnr = addr.postnummer !== null ? addr.postnummer : ''
    let by = addr.postdistrikt !== null ? addr.postdistrikt : ''

    return `${vej} ${husnr}${litra} ${postnr} ${by}`
}

let getGeometryFromID = function (addrID) {
    return $.getJSON("http://dawa.aws.dk/adresser/" + addrID)
}

let getAddrID = function (address) {
    return $.getJSON("http://dawa.aws.dk/datavask/adresser?betegnelse=" + address).then(data => {
        // for stor usikkerhed med adresser i kat: C
        if (data.kategori == "C") {
            console.log("kunne ikke finde adresse");
        } else {
            return data.resultater[0].aktueladresse.id;
        }

    })
}