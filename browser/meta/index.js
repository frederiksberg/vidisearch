'use strict';

/**
 *
 * @type {*|exports|module.exports}
 */
var urlparser = require('../../../../browser/modules/urlparser');

/**
 * @type {string}
 */
var db = urlparser.db;

/**
 * @type {*|exports|module.exports}
 */
var React = require('react');

import mustache from 'mustache';
import SvgIcon from '@material-ui/core/SvgIcon';
import dayjs from 'dayjs';

var cloud;

var utils;

var legend;

const marked = require('marked');

var config = require('../../../../config/config.js');

var mainSearch;

var items = {};

var moduleName = 'Lag'

function LayerIcon(props) {
    return <SvgIcon {...props}>
        <path fill="#000000"
              d="M12,16L19.36,10.27L21,9L12,2L3,9L4.63,10.27M12,18.54L4.62,12.81L3,14.07L12,21.07L21,14.07L19.37,12.8L12,18.54Z"/>
    </SvgIcon>;
}

module.exports = {
    set: function (o) {
        cloud = o.cloud;
        utils = o.utils;
        legend = o.legend;
        mainSearch = o.extensions.vidisearch.index;

        mainSearch.registerSearcher({
            key: moduleName,
            obj: {'searcher': this, 'title': moduleName, 'icon': <LayerIcon/>}
        });
    },

    init: function () {
    },

    search: function (searchTerm) {
        let url = '/api/elasticsearch/search/' + db + '/settings/geometry_columns_view';
        let query = {
            "size": 100,
            "query": {
                "bool": {
                    "should": [
                        {
                            "term": {
                                "properties.f_table_name": searchTerm
                            }
                        }, {
                            "term": {
                                "properties.f_table_title": searchTerm
                            }
                        }, {
                            "term": {
                                "properties.f_table_abstract": searchTerm
                            }
                        },
                        {
                            "term": {
                                "properties.tags": searchTerm
                            }
                        },
                        {
                            "term": {
                                "properties.meta.meta_desc": searchTerm
                            }
                        }
                    ],

                    "minimum_should_match": 1
                }
            }
        };

        return new Promise(function (resolve, reject) {
            $.ajax({
                url: url,
                type: "POST",
                data: JSON.stringify(query),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (data) {
                    let res = data.hits.hits.map((item) => {
                        let it = item['_source']['properties'];
                        items[it._key_] = item['_source'];
                        return {
                            name: (it.f_table_title || it.f_table_name),
                            'id': it._key_
                        };
                    });
                    resolve({'type': moduleName, icon: <LayerIcon/>, results: res});
                }
            })
        });
    },

    handleSearch: function (item, setCaretPosition) {
        let properties = items[item.id].properties, html, meta, name, title, abstract, layerId;

        setCaretPosition(item.name.length);

        meta = properties.meta;
        name = properties.f_table_name;
        title = properties.f_table_title || properties._key_;
        abstract = properties.f_table_abstract;
        html = (meta !== null
            && typeof meta.meta_desc !== "undefined"
            && meta.meta_desc !== "") ?
            marked(meta.meta_desc) : abstract;
        layerId = item.id.split(".")[0] + "." + item.id.split(".")[1];

        dayjs().locale(navigator.language.indexOf(`da_`) === 0 ? "da" : "en");

        for (let key in properties) {
            if (properties.hasOwnProperty(key)) {
                if (key === "lastmodified") {
                    properties[key] = dayjs(properties[key]).format('LLLL');
                }
            }
        }

       // html = html ? mustache.render(html, properties) : "";

        return new Promise(function (resolve, reject) {

            let comp =
                <div>
                    <h3 className="content">{title || name}</h3>
                    <div className="content"></div>
                    <div>
                        <li className='list-group-item'>
                            <div className='checkbox'><label><input type='checkbox' data-gc2-id={layerId}/>{title}
                            </label></div>
                        </li>
                    </div>
                </div>

            resolve({component: comp, newQuery: null, showSearcher: false});
        });
    }
};

class Tags extends React.Component {
    render() {
        var items = this.props.items.map((item, index) => {
            return (
                <li key={index.toString()} style={{
                    color: "white",
                    background: "#03a9f4",
                    display: "inline-block",
                    padding: "2px",
                    margin: "2px"
                }}> {item} </li>
            );
        });
        return (
            <ul style={{listStyleType: "none"}} className="list-group"> {items} </ul>
        );
    }
}
