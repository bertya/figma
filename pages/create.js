import Layout from '../components/layout';
import Router from 'next/router'
import React from 'react';

class Create extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      fileId:'',
      fileName:''
    }

    this.handleNameChange = this.handleNameChange.bind(this);
    this.handleIdChange = this.handleIdChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleIdChange(e) {
    this.setState({
      fileId : e.target.value,
    });
  }

  handleNameChange(e) {
    this.setState({
      fileName : e.target.value,
    });
  }

  handleSubmit(e) {
    e.preventDefault();
    fetch('/api/create-project',{
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body : JSON.stringify({
        id : this.state.fileId,
        name: this.state.fileName
      })
    }).then((res)=>{
      console.log(res);
      Router.push('/');
    });
  }

  render() {
    return (
      <div>
        <Layout>
          <p>Create Next.js</p>
          <form onSubmit={this.handleSubmit}>
            <input value={this.state.projectName} onChange={this.handleNameChange} />
            <input value={this.state.projectId} onChange={this.handleIdChange} />
            <button type="submit">submit</button>
          </form>
        </Layout>
      </div>
    );
  }
}

export default Create;