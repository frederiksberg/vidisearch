

import React from 'react'
import Tooltip from '@material-ui/core/Tooltip';


class SearchSelector extends React.Component {

    constructor(props) {
        super(props);

        let searchers = []

        for (let searcherName in props.searchers) {
            let searcher = this.props.searchers[searcherName];
            searchers.push({ id: searcher.title, icon: searcher.icon, enabled: true })
        }

        this.state = {
            searchers: searchers
        }
    }

    onClick = (index) => {

        let searchers = []

        for (let searcherName in this.props.searchers) {
            let searcher = this.props.searchers[searcherName];
            if (this.props.enabledSearchers.includes(searcherName)) {
                searchers.push({ id: searcher.title, icon: searcher.icon, enabled: true })
            }
            else {
                searchers.push({ id: searcher.title, icon: searcher.icon, enabled: false })
            }
        }

        searchers[index].enabled = !searchers[index].enabled;

        this.setState({
            searchers: searchers
        })

        let newSearchers = searchers.filter(x => x.enabled).map(x => x.id);

        this.props.onSeachersChanged(newSearchers);
    }

    render() {

        let categories = this.state.searchers.map((item, index) => {
            let enabled = this.props.enabledSearchers.includes(item.id);
            return (
                <Tooltip PopperProps={{className:"MuiTooltip-tooltip-custom"}}  key={item.id} title={item.id}>
                    <div  onClick={() => this.onClick(index)} className={enabled ? "button enabled" : "button"}>{item.icon}</div>
                </Tooltip>
            )
        });

        return (
            <div className="search-selector">
                {categories}
            </div>
        );
    }
}

export default (SearchSelector);