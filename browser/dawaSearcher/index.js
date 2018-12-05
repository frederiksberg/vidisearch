'use strict';

/**
 * @type {*|exports|module.exports}
 */
var React = require('react');;

var ReactDOM = require('react-dom');

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import Place from '@material-ui/icons/Place';
import ChevronRight from '@material-ui/icons/ChevronRight';
import ExpandLess from '@material-ui/icons/ExpandLess';
import Divider from '@material-ui/core/Divider';
import SvgIcon from '@material-ui/core/SvgIcon';

var reproject = require('reproject');

var proj4 = require('proj4');

var wktParser = require('terraformer-wkt-parser');

var cloud;

var layerGroup = L.layerGroup();

var utils;

var mapObj;

var exId = "mainSearch";

var backboneEvents;

var config = require('../../../../config/config.js');

var mainSearch;

var crss = {
    "from": "+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs",
    "to": "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs"
};

function RoadIcon(props) {
    return <SvgIcon {...props}>
        <path d="M18.1,4.8C18,4.3 17.6,4 17.1,4H13L13.2,7H10.8L11,4H6.8C6.3,4 5.9,4.4 5.8,4.8L3.1,18.8C3,19.4 3.5,20 4.1,20H10L10.3,15H13.7L14,20H19.8C20.4,20 20.9,19.4 20.8,18.8L18.1,4.8M10.4,13L10.6,9H13.2L13.4,13H10.4Z" />
    </SvgIcon>
}

class AdresseItem extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        let liStyle = {
            padding: '4px 16px'
        };
        return <a id={this.props.hrf} style={liStyle} href="#" className="list-group-item">
            {this.props.value}
        </a>
    }
}


class AdresseList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            items: this.props.items
        }
    }

    handleClk(href) {
        let map = cloud.get().map;

        $.getJSON(href, function (data) {
            let coords = data.adgangspunkt.koordinater;
            coords = [coords[1], coords[0]];
            mapObj.eachLayer(function (layer) {
                if (layer instanceof L.Marker) {
                    mapObj.removeLayer(layer);
                }
            });
            var marker = L.marker(coords).addTo(mapObj);
            mapObj.setView(coords, 17);
        });
    }

    render() {
        const items = this.state.items;
        let me = this;
        const searchItems = items.map((item, index) =>
            <ListItem key={index + ':' + item.tekst.toString()}
                hrf={item.href}
                value={item.tekst}
                button
                onClick={(e) => this.handleClk(item.href)}
            >
                <ListItemIcon>
                    <Place />
                </ListItemIcon>
                <ListItemText primary={item.tekst} />
            </ListItem>
        );

        return (
            <List component="nav">{searchItems}</List>
        );
    }
}

function handleAutocompleteSearch(res) {
    let results = res.map((item, index) => {
        return {
            name: `${item.tekst}`,
            properties: { ...item }
        };
    });
    return {
        'type': 'Adresser',
        icon: <RoadIcon />,
        results: results
    };
}

function handleNormalSearch(res, searchTerm) {

    let url = `https://dawa.aws.dk/adgangsadresser/autocomplete?q=${searchTerm}*&type=adgangsadresse&side=1&per_side=105&noformat=1&kommunekode=147`

    if (res.length === 0) {
        return new Promise(function (resolve, reject) {
            $.getJSON(url, (res) => {
                resolve(handleAutocompleteSearch(res))
            });
        });
    }

    let results = res.map(x => {
        return {
            name: `${x.navn} ${x.kommuner[0].navn}`,
            properties: { ...x }
        }
    });
    return {
        'type': 'Adresser',
        icon: <RoadIcon />,
        results: results
    };
}

module.exports = {
    set: function (o) {
        cloud = o.cloud;
        utils = o.utils;
        backboneEvents = o.backboneEvents;
        mapObj = cloud.get().map;
        mainSearch = o.extensions.vidisearch.index;

        let me = this;
        mainSearch.registerSearcher({
            key: 'Adresser',
            obj: { 'searcher': this, 'title': 'Adresser', 'icon': <RoadIcon /> }
        });

    },

    init: function () {

    },


    search: function (searchTerm) {
        if (searchTerm) {
            searchTerm = searchTerm + '*';
        }
        let url = `https://dawa.aws.dk/vejnavne?q=${searchTerm}&side=1&per_side=100&kommunekode=147`;


        return new Promise(function (resolve, reject) {
            $.getJSON(url, (res) => resolve(handleNormalSearch(res, searchTerm)));
        })
    },

    handleSearch: function (item, setCaretPosition) {

        if (item.properties.tekst !== undefined) {
            setCaretPosition(item.properties.tekst.length);

            $.getJSON(item.properties.adgangsadresse.href, function (data) {
                let coords = data.adgangspunkt.koordinater;
                coords = [coords[1], coords[0]];
                mapObj.eachLayer(function (layer) {
                    if (layer instanceof L.Marker) {
                        mapObj.removeLayer(layer);
                    }
                });
                var marker = L.marker(coords).addTo(mapObj);
                mapObj.setView(coords, 17);
            });

            return new Promise(function (resolve, reject) {
                resolve({ component: <div>{item.properties.tekst}</div>, newQuery: item.properties.tekst });
            })
        }

        const { properties } = item;

        let roadName = properties.navn;

        let zipCode = '';
        if (properties.postnumre.length > 0) {
            zipCode = properties.postnumre[0].nr;
        }

        let cityName = ''
        if (properties.kommuner.length > 0) {
            cityName = properties.kommuner[0].navn;
        }


        let newQuery = `${roadName}  ${zipCode} ${cityName}`


        setCaretPosition(roadName.length + 1);

        return new Promise(function (resolve, reject) {
            resolve({ component: <div>{newQuery}</div>, newQuery: newQuery, showSearcher:true });
        })
    },

    handleMouseOver: function (s) {
        return new Promise(function (resolve, reject) {
            resolve('hello');
        })
    },

    handleMouseOut: function (s) {
        return new Promise(function (resolve, reject) {
            resolve('hello');
        })
    }
}