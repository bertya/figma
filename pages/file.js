import Layout from '../components/layout';
import Router from 'next/router'
import React from 'react';
import fetch from 'isomorphic-unfetch';

const imgStyle = {
  maxWidth:300
}

class File extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      pages:null,
      images: null
    }
  }

  componentDidMount() {
    const pageData = fetch(`/api/file/${this.props.id}`);
    pageData.then((data)=>{
      return data.json();
    }).then((data)=>{
      console.log(data);
      this.setState({
        pages: data.pages,
        images: data.images
      });
    })
  }

  displayFiles() {
    return this.state.pages.map(page => {
      console.log(21);
      console.log(page);
      return (
        <li key={page.id}><img src={this.state.images[page.id]} style={imgStyle}></img>{page.name}</li>
      );
    });y
  }

  render() {
    console.log(this.state);
    if (this.state.pages == null) {
      return (
        <div>Loading</div>
      )
    }

    return ( 
      <Layout>
        <ul>
          {this.displayFiles()}
        </ul>
      </Layout>
    );
  }
}

File.getInitialProps = async function (context) {
  const { id } = context.query;
  // const baseUrl = context.req ? `${context.req.protocol}://${context.req.get('Host')}` : '';

  // console.log(`Fetched show: ${show.name}`);

  return { id };
}

export default File;