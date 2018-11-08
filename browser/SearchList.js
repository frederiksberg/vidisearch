

import React from 'react'
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ChevronRight from '@material-ui/icons/ChevronRight';


class SearchList extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            items: this.props.items
        };
    }


    caculateItemCountToShow(searcherCount) {
        switch (searcherCount) {
            case 1:
                return 20;
            case 2:
                return 10;
            case 3:
                return 5;
            default:
                return 5;
        }
    }

    highlightSearchInText(text) {
        let searchTerm = this.props.searchTerm.toLowerCase();
        let textLower = text.toLowerCase();

        let indexOf = textLower.indexOf(searchTerm);

        if (indexOf == -1 || searchTerm === '') {
            return null;
        }

        let startString = text.substring(0, indexOf);
        let middleString = text.substring(indexOf, indexOf + searchTerm.length);
        let endString = text.substring(indexOf + searchTerm.length, text.length);

        return {
            start: startString,
            middle: middleString,
            end: endString
        }
    }

    renderCategory(seacherName, searcher, searcherCount, selectionOptions) {

        let numberOfitems = this.caculateItemCountToShow(searcherCount);
        let itemsToShow = searcher.results.slice(0, numberOfitems);

        const searchItems = itemsToShow.map((item, index) => { return this.renderItems(item, index, seacherName, selectionOptions) });

        return (
            <div key={seacherName}>
                <ListItem className="category" onClick={() => this.props.onCategoryClick(seacherName)}>
                    <ListItemIcon className="icon">
                        {searcher.icon}
                    </ListItemIcon>
                    <ListItemText className="text" primary={`${seacherName} (${searcher.results.length})`} />
                    <ChevronRight />
                </ListItem>
                {searchItems}
            </div>
        )
    }

    renderItems(item, index, seacherName, selectionOptions) {

        selectionOptions.currentIndex++;

        let className = selectionOptions.selected == selectionOptions.currentIndex ? 'result selected' : 'result';
        let highlight = this.highlightSearchInText(item.name);

        let element = highlight ?
            <div className="text" >{highlight.start} <span>{highlight.middle}</span> {highlight.end}</div> :
            <div className="text" >{item.name}</div>

        return (
            <ListItem key={index} className={className} onClick={() => this.props.onResultClick(seacherName, item)}>
                {element}
            </ListItem>
        )
    }

    render() {
        const { searchResults, selectedResult } = this.props;

        //Used to make navigation with the arrow keys possible
        let selectionOptions = {
            selected: selectedResult,
            currentIndex: 0
        }

        let searcherCount = Object.keys(searchResults).length;
        let resultElements = []

        for (let searcherName in searchResults) {
            let searcher = searchResults[searcherName];

            resultElements.push(this.renderCategory(searcherName, searcher, searcherCount, selectionOptions));
        }

        this.props.onResultSetUpdated(selectionOptions.currentIndex);

        return (
            <List className="search-list">{resultElements}</List>
        );
    }
}

export default (SearchList);