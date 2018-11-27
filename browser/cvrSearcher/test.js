let query = {
    "_source": [
        "Vrvirksomhed.virksomhedMetadata"
    ],
    "query": {
        "bool": {
            "must": {
                "match": {
                    "Vrvirksomhed.virksomhedMetadata.nyesteNavn.navn": "Ur"
                }
            },
            "filter": {
                "match": {
                    "Vrvirksomhed.virksomhedMetadata.nyesteBeliggenhedsadresse.kommune.kommuneKode": 147
                }
            }
        }
    }
}

let settings = {
    "async": true,
    "crossDomain": true,
    "url": "data.json",
    //"url": "http://distribution.virk.dk/cvr-permanent/virksomhed/_search",
    "method": "GET",
    "headers": {
        "Content-Type": "application/json",
        "Authorization": "Basic RnJlZGVyaWtzYmVyZ19Lb21tdW5lX0NWUl9JX1NLWUVOOmZlNzAxNjJhLWMwZmQtNGI3Ni1hMzY2LWJkYTdlYTU5NmJhZA==",
        "cache-control": "no-cache",
        "Postman-Token": "277573e1-0a38-4f79-b03b-a9ce7257b352"
    },
    "processData": false,
    "data": query
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

//tager nyesteBeliggenhedsadresse og laver adressestreng
let CVRaddress = function (addr) {

    let vej = addr.vejnavn
    let husnr = addr.husnummerFra
    let litra = addr.bogstavFra
    let etage = addr.etage
    let sidedoer = addr.sidedoer
    let postnr = addr.postnummer
    let by = addr.postdistrikt

    address = `${vej} ${husnr}${litra} ${etage} ${sidedoer}, ${postnr} ${by}`

    return address
}

let getGeometryFromID = function (addrID) {
    return $.getJSON("http://dawa.aws.dk/adresser/" + addrID)
}

let getGeometryFromAddress = function (addr) {
    address = CVRaddress(addr)
    getAddrID(address).then(function (data) {
        getGeometryFromID(data).then(function (addr) {
            console.log(addr.adgangsadresse.adgangspunkt.koordinater)
        })
    })
}

$.ajax(settings).done(function (res) {
    //console.log(res);
    res.hits.hits.forEach(element => {

        let addr = element._source.Vrvirksomhed.virksomhedMetadata.nyesteBeliggenhedsadresse
        
        if (addr.adresseId !== undefined) {
            getGeometryFromID(addr.adresseId).done(function (res) {
                console.log(res.adgangsadresse.adgangspunkt.koordinater)
            })
        } else {
            getGeometryFromAddress(addr)
        }
    });
});

//getAdrID('smalle gade 1 2000')
