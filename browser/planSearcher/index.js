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
        <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" />
    </SvgIcon>
}

module.exports = {
    set: function (o) {
        cloud = o.cloud;
        utils = o.utils;
        mapObj = cloud.get().map;
        mainSearch = o.extensions.vidisearch.index;

        mainSearch.registerSearcher({
            key: 'Lokalplaner',
            obj: { 'searcher': this, 'title': 'Lokalplaner', 'icon': <BuildingIcon /> }
        });
    },

    init: function () {

    },

    search: function (searchTerm) {
        let url = 'https://gc2.frederiksberg.dk/api/v2/elasticsearch/search/frederiksberg/elasticsearch/lokalplan_dokument';
        let query = `{
            "_source":{
              "excludes":[
                "properties.document"
              ]
            },
            "size":100,
            "query":{
              "match":{
                "properties.document": "${searchTerm}"
              }
            }
          }`;
        return new Promise(function (resolve, reject) {
            $.post(url, query, function (data) {
                let res = data.hits.hits.map((item) => {
                    let it = item['_source']['properties'];
                    return {
                        name: it.plannavn,
                        'id': it.planid
                    };
                });
                resolve({ type: 'Lokalplaner', icon: <BuildingIcon />, results: res });
            }, 'json');
        });

    },

    handleSearch: function (item, setCaretPosition) {
        let url = `https://gc2.frederiksberg.dk/api/v1/sql/frederiksberg?q=SELECT plannr, plannavn, doklink, 
        the_geom from job_plandatadk.lokalplan where planid =${item.id}&srs=4326`;

        return new Promise(function (resolve, reject) {

            $.getJSON(url, function (data) {
                let geom = data.features[0].geometry;
                console.log(geom);
                let properties = data.features[0].properties;
                let layer = L.geoJson(geom, {
                    "color": "blue",
                    "weight": 1,
                    "opacity": 1,
                    "fillOpacity": 0.1,
                    "dashArray": '5,3'
                });

                layerGroup.clearLayers();
                console.log(layer);
                layerGroup.addLayer(layer).addTo(mapObj);
                mapObj.fitBounds(layer.getBounds());
                let comp = <div>
                    <ul className="list-group">
                        <li className="list-group-item">Plannavn : {properties.plannavn}</li>
                        <li className="list-group-item">Plannr   : {properties.plannr}</li>
                        <li className="list-group-item">Anvendelse: {properties.anvendelsegenerel}</li>
                        <li className="list-group-item">
                            <a href={properties.doklink} target="_blank" >Plandokument</a>
                        </li>
                    </ul>
                </div>;
                resolve({ component: comp, newQuery: item.id });
            })
        });
        //   console.log(searchTerm);
    },

    handleMouseOver: function (s) {
        console.log('plan mouseover');
        let url = `https://gc2.frederiksberg.dk/api/v1/sql/frederiksberg?q=SELECT plannr, plannavn, doklink, 
        the_geom from job_plandatadk.lokalplan where planid =${searchTerm}&srs=4326`;
        return new Promise(function (resolve, reject) {
            $.getJSON(url, function (data) {
                let geom = data.features[0].geometry;
                console.log(geom);
                let properties = data.features[0].properties;
                let layer = L.geoJson(geom, {
                    "color": "blue",
                    "weight": 1,
                    "opacity": 1,
                    "fillOpacity": 0.1,
                    "dashArray": '5,3'
                });

                layerGroup.clearLayers();
                layerGroup.addLayer(layer).addTo(mapObj);
                mapObj.fitBounds(layer.getBounds());
                console.log('plan mouseover');
                resolve('hello');
            })
        })
    },

    handleMouseOut: function (s) {
        return new Promise(function (resolve, reject) {
            console.log(s);
            resolve('hello');
        })
    }
}