

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

    renderCategory(seacherName, searcher, searcherCount, selectionOptions) {

        let numberOfitems = this.caculateItemCountToShow(searcherCount);
        let itemsToShow = searcher.results.slice(0, numberOfitems);

        const searchItems = itemsToShow.map((item, index) => { return this.renderItems(item, index, seacherName,selectionOptions) });

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

    renderItems(item, index, seacherName,selectionOptions) {

        let key = index + ':' + item.id;
        selectionOptions.currentIndex++;

        let className = 'result';

        if (selectionOptions.selected ==  selectionOptions.currentIndex){
            className += ' selected'
        }

        return (
            <ListItem key={key} className={className} onClick={() => this.props.onResultClick(seacherName, item)}>
                <ListItemText className="text" primary={item.name} />
                <ChevronRight />
            </ListItem>
        )
    }

    render() {
        const { searchResults, selectedResult } = this.props;

        let resultElements = []

        let searcherCount = Object.keys(searchResults).length;

        let selectionOptions = {
            selected:selectedResult,
            currentIndex:0
        }

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