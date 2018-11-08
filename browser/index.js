'use strict';

/**
 * @type {*|exports|module.exports}
 */
var React = require('react');

var ReactDOM = require('react-dom');

import Divider from '@material-ui/core/Divider';
import Search from '@material-ui/icons/Search';
import HighlightOff from '@material-ui/icons/HighlightOff';
import FormControl from '@material-ui/core/FormControl';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import InputAdornment from '@material-ui/core/InputAdornment';
import IconButton from '@material-ui/core/IconButton';
import SearchList from './SearchList';
import SearchSelector from './SearchSelector';

var cloud;
var utils;
var exId = "mainSearch";

var _searchers = {};

module.exports = {
    set: function (o) {
        cloud = o.cloud;
        utils = o.utils;
    },

    registerSearcher: function (searcher) {
        _searchers[searcher['key']] = searcher['obj'];
    },

    init: function () {
        utils.createMainTab(exId, __("Main Search!"), __("Search prototype...."), require('./../../../browser/modules/height')().max, 'search');

        class MainSearch extends React.Component {
            constructor(props) {
                super(props);

                let searcherNames = [];

                for (let name in _searchers) {
                    searcherNames.push(name);
                }

                this.state = {
                    enabledSearchers: [...searcherNames],
                    searchTerm: '',
                    selectedResult: 0,
                    resultSize: 0, //used for movement with arrow keys
                    searchResults: {},
                    searchDetails: <div></div>
                };

                this.searchers = _searchers;
                this.componentsToRender = [];
                this.timer = {};
            }

            componentDidMount() {
                this.search(this.state.searchTerm);
            }

            clearSearchBox = (e) => {
                let searcherNames = [];
                for (let name in this.searchers) {
                    searcherNames.push(name);
                }

                this.setState({
                    searchTerm: "",
                    enabledSearchers: searcherNames,
                    searchDetails: < div ></div >
                }, () => {
                    this.search(this.state.searchTerm);
                });
            }

            onResultClick(category, item) {
                this.searchers[category].searcher.handleSearch(item, (position) => { this.setCaretPosition('search-field', position) }).then((result) => {

                    let isNewQuery = result.newQuery !== null;

                    this.setState({
                        searchTerm: isNewQuery ? result.newQuery : this.state.searchTerm,
                        searchDetails: result.component
                    }, () => {
                        this.search(this.state.searchTerm);
                    })
                });
            }

            onCategoryClick(category) {
                this.setState({
                    enabledSearchers: [category]
                }, () => {
                    this.search(this.state.searchTerm);
                })
            }

            handleChange = (e) => {
                let searchQuery = e.target.value;

                this.setState({
                    searchTerm: searchQuery
                });

                this.debounce(() => { this.search(searchQuery) }, 250);
            }

            search = (searchQuery) => {
                let searchPromises = [];

                for (let seacherName in this.searchers) {
                    if (this.state.enabledSearchers.includes(seacherName)) {
                        searchPromises.push(this.searchers[seacherName].searcher.search(searchQuery));
                    }
                }

                Promise.all(searchPromises).then(
                    (results) => {
                        let searchResults = this.groupBy(results, 'type');

                        this.setState({
                            searchResults: searchResults,
                            selectedResult: 0
                        });
                    });
            }

            searchersChanged(enabledSearchers) {
                this.setState({
                    enabledSearchers: enabledSearchers
                }, () => {
                    this.search(this.state.searchTerm);
                })
            }

            debounce(fs, timeout) {
                this.timer.count = Date.now();
                let self = this;

                this.timer.function = setTimeout(() => {
                    if (Date.now() - self.timer.count >= timeout) {
                        fs();
                    }
                }, timeout)
            }

            groupBy(xs, key) {
                return xs.reduce(function (rv, x) {
                    (rv[x[key]] = rv[x[key]] || { results: [...x.results], icon: x.icon });
                    return rv;
                }, {});
            };

            setCaretPosition(elemId, caretPos) {
                setTimeout(() => {
                    var elem = document.getElementById(elemId);

                    if (elem.selectionStart) {
                        elem.focus();
                        elem.setSelectionRange(caretPos, caretPos);
                    }
                    else
                        elem.focus();

                }, 300);
            }

            onResultSetUpdated(count) {
                this.resultSize = count
            }

            handleKeyboard(e) {
                let newSelectedResult = this.state.selectedResult

                switch (e.keyCode) {
                    default:
                        return;
                    case 13: //Enter
                        $('.vidi-search .result.selected').click();
                        break;
                    case 38: //Arrow up
                        newSelectedResult -= 1
                        break;
                    case 40: //Arrow down
                        newSelectedResult += 1
                        break;
                }

                if (newSelectedResult <= 0) {
                    newSelectedResult = this.resultSize;
                }

                if (newSelectedResult > this.resultSize) {
                    newSelectedResult = 0 + 1;
                }

                this.setState({
                    selectedResult: newSelectedResult
                });
            }

            handleKeyDown(e) {
                if (e.keyCode === 38 || e.keyCode === 40) e.preventDefault();
            }

            render() {

                return (
                    <div role="tabpanel" className="vidi-search">
                        <SearchSelector searchers={this.searchers} enabledSearchers={this.state.enabledSearchers} onSeachersChanged={(enabledSearchers) => this.searchersChanged(enabledSearchers)} />
                        <div className="panel panel-default">
                            <div className="panel-body">
                                <FormControl fullWidth>
                                    <InputLabel htmlFor="search-field">Søg</InputLabel>
                                    <Input
                                        id="search-field"
                                        className="search"
                                        type="text"
                                        value={this.state.searchTerm}
                                        onKeyUp={(e) => this.handleKeyboard(e)}
                                        onKeyDown={(e) => this.handleKeyDown(e)}
                                        onChange={this.handleChange}
                                        endAdornment={
                                            <InputAdornment position="end">
                                                <IconButton onClick={this.clearSearchBox} >
                                                    {this.state.searchTerm ? <HighlightOff /> : <Search />}
                                                </IconButton>
                                            </InputAdornment>
                                        }
                                    />
                                </FormControl>
                                <SearchList
                                    searchTerm={this.state.searchTerm}
                                    searchResults={this.state.searchResults}
                                    selectedResult={this.state.selectedResult}
                                    onCategoryClick={(category) => this.onCategoryClick(category)}
                                    onResultClick={(category, item) => this.onResultClick(category, item)}
                                    onResultSetUpdated={(count) => this.onResultSetUpdated(count)}
                                />
                                {this.state.searchDetails}
                            </div>
                        </div>
                    </div>
                );
            }
        }

        try {
            ReactDOM.render(
                <MainSearch />,
                document.getElementById(exId)
            );
        } catch (e) {

        }
    }
};