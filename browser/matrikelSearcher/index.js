'use strict';


import SvgIcon from '@material-ui/core/SvgIcon';
/**
 * @type {*|exports|module.exports}
 */
var React = require('react');;

var ReactDOM = require('react-dom');

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

var matrWkt = {};

function LayerIcon(props) {
    return <SvgIcon {...props}>
        <path d="M19 11h-8v6h8v-6zm4 8V4.98C23 3.88 22.1 3 21 3H3c-1.1 0-2 .88-2 1.98V19c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zm-2 .02H3V4.97h18v14.05z" />
    </SvgIcon>;
}

class SearchItem extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        let liStyle = {
            padding: '4px 16px'
        };
        return <a style={liStyle} id={this.props.searcher + ':' + this.props.value} href="#" className="list-group-item">
            {this.props.value}
        </a>;
    }


}

class SearchList extends React.Component {

    constructor(props) {
        super(props);
        // this.searcher = this.props.searcher;
        this.onItemClick = this.onItemClick.bind(this);

        this.state = {
            items: this.props.items
        };
    }
    onItemClick(e) {
        //   console.log(e.target.id); 
        let searcher = searchers[this.props.searcher];
        let me = this;
        searcher.handleSearch(e.target.id).then(function (fulfilled) {
            let items = fulfilled.map((item) => {
                return item.tekst.toString();
            });
            me.setState({ items: items });
        });
    }
    render() {
        const items = this.props.items;
        let me = this;
        const searchItems = items.map((item) =>
            <SearchItem key={item.toString()} searcher={me.props.searcher} value={item} />
        );



        return (
            <div onClick={this.props.onAdd} className="list-group">{searchItems}</div>
        );
    }
}

module.exports = {
    set: function (o) {
        cloud = o.cloud;
        utils = o.utils;
        backboneEvents = o.backboneEvents;
        mapObj = cloud.get().map;
        mainSearch = o.extensions.vidisearch.index;

        mainSearch.registerSearcher({
            key: 'Matrikler',
            obj: { 'searcher': this, 'title': 'Matrikler', 'icon': <LayerIcon /> }
        });
    },

    init: function () {
        let me = this;
    },

    test: function () {
    },

    search: function (searchTerm) {
        if (!searchTerm) {
            searchTerm = "a b c d e f g h i j k l m 1 2 3 4 5 6";
        }
        let url = "https://kortforsyningen.kms.dk/Geosearch?service=GEO&limit=100&resources=matrikelnumre" +
            "&area=muncode0147" +
            "&search=" + searchTerm +
            "&login=magloire&password=Kort_1234";

        let me = this;
        return new Promise(function (resolve, reject) {
            $.getJSON(url, function (data) {
                if (data.data !== null) {
                    let res = data.data.map((item) => {
                        let it = item.matrnr + ", " + item.elavsnavn;
                        matrWkt[it] = item.geometryWkt_detail;
                        return { name: it, id: it };
                    });
                    resolve({ 'type': 'Matrikler', icon: <LayerIcon />, results: res });
                }

                resolve({ 'type': 'Matrikler', icon: <LayerIcon />, results: [] });
            });
        })

    },

    handleSearch: function (item, setCaretPosition) {
        let me = this;
        let wkt = matrWkt[item.id];
        let geojson = wktParser.parse(wkt);
        geojson = JSON.parse(JSON.stringify(geojson));
        geojson = reproject.toWgs84(geojson, "from", crss);
        let myLayer = L.geoJson(geojson, {
            "color": "blue",
            "weight": 1,
            "opacity": 1,
            "fillOpacity": 0.1,
            "dashArray": '5,3'
        });

        layerGroup.clearLayers();
        layerGroup.addLayer(myLayer).addTo(mapObj);

        /*  hack in order to center the map...   */
        let point = geojson.coordinates[0][0];
        point = [point[1], point[0]];
        mapObj.setView(point, 17);

        return new Promise(function (resolve, reject) {
            let data = [item.id];
            let comp = <div>
                <h3>Matrikler</h3>
                <SearchList items={data} searcher='matrikel' />
            </div>;

            let resultLayer = new L.FeatureGroup();

            resolve({ component: comp, newQuery: item.id });
        });
    },

    handleMouseOver: function (s) {
        return new Promise(function (resolve, reject) {
            console.log(s);
            let wkt = matrWkt[s];
            let geojson = wktParser.parse(wkt);
            geojson = JSON.parse(JSON.stringify(geojson));
            geojson = reproject.toWgs84(geojson, "from", crss);
            let myLayer = L.geoJson(geojson, {
                "color": "blue",
                "weight": 1,
                "opacity": 1,
                "fillOpacity": 0.1,
                "dashArray": '5,3'
            });

            layerGroup.clearLayers();
            layerGroup.addLayer(myLayer).addTo(mapObj);

            /*  hack in order to center the map...   */
            let point = geojson.coordinates[0][0];
            point = [point[1], point[0]];
            mapObj.setView(point, 16);
            resolve('hello');
        })
    },

    handleMouseOut: function (s) {
        return new Promise(function (resolve, reject) {
            console.log(s);
            resolve('hello');
        })
    }
}