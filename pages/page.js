import Layout from '../components/layout';
import Router from 'next/router'
import React from 'react';
import fetch from 'isomorphic-unfetch';

const imgStyle = {
  maxWidth:300
}

class Page extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      changes:null,
      images: null
    }
  }

  componentDidMount() {
    const pageData = fetch(`/api/file/${this.props.id}/${this.props.page}`);
    pageData.then((data)=>{
      return data.json();
    }).then((data)=>{
      this.setState({
        changes: data.images
      });
    })
  }

  displayChanges() {
    // return this.state.pages.map(page => {
    //   console.log(21);
    //   console.log(page);
    //   return (
    //     <li key={page.id}><img src={this.state.images[page.id]} style={imgStyle}></img>{page.name}</li>
    //   );
    // });
    for (let key in this.state.changes) {
      return (
        <li key={key}><img src={this.state.changes[key]} style={imgStyle}></img></li>
      );
    }
  }

  render() {
    console.log(this.state);
    if (this.state.changes == null) {
      return (
        <div>Loading</div>
      )
    }

    return ( 
      <Layout>
        <ul>
          {this.displayChanges()}
        </ul>
      </Layout>
    );
  }
}

Page.getInitialProps = async function (context) {
  const { id, page } = context.query;
  // const baseUrl = context.req ? `${context.req.protocol}://${context.req.get('Host')}` : '';

  // console.log(`Fetched show: ${show.name}`);

  return { id, page };
}

export default Page;