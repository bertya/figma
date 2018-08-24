const express = require('express');
const next = require('next');
const fb = require('./firebase');
var request = require('request-promise-native');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

function modiFile(figFile) {
  let file = JSON.parse(figFile);
  let doc = file.document;
  file.document.children = null;
  return file;
}

function modiFileB(figFile) {
  let file = JSON.parse(figFile);
  let doc = file.document;
  for (let i = 0; i < doc.children.length; i++) {
    doc.children[i].children = JSON.stringify(doc.children[i].children);
  }
  return file;
}

function modiFileC(figFile) {
  let file = JSON.parse(figFile);
  for (let i = 0; i < file.length; i++) {
    file[i] = JSON.stringify(file[i]);
  }
  return file;
}

function createFile(id, name) {
    request({
      uri: `https://api.figma.com/v1/files/${id}`,
      headers: {
        'X-FIGMA-TOKEN': '2632-41a309eb-5f9f-4829-8aca-cc0963bb0857'
      }
    })
    .then((body)=>{
      const file = modiFile(body);
      file.name = name;
      const docRef = fb.db.collection('files').doc(id);

      request({
        uri: `https://api.figma.com/v1/files/${id}/versions`,
        headers: {
          'X-FIGMA-TOKEN': '2632-41a309eb-5f9f-4829-8aca-cc0963bb0857'
        }
      })
      .then((body)=>{
        body = JSON.parse(body);
        docRef.update({
          "version" : body.versions[0].id
        });
      })
      .catch((err)=>{
        console.log(err);
      });

      return docRef.set(file);
    })
    .catch((err)=>{
      console.log(err);
    });
}

function getImgList(id, string) {
  return request({
    uri: `https://api.figma.com/v1/images/${id}`,
    headers: {
      'X-FIGMA-TOKEN': '2632-41a309eb-5f9f-4829-8aca-cc0963bb0857'
    },
    qs : {
      format: 'png',
      ids: string
    }
  });
}

app.prepare()
.then(() => {
  const server = express();

  //hand json
  server.use(express.json());

  server.get('/p/:id', (req, res) => {
    const actualPage = '/post'
    const queryParams = { id: req.params.id } 
    app.render(req, res, actualPage, queryParams)
  });

  server.get('/file/:id', (req, res) => {
    const actualPage = '/file'
    const queryParams = { id: req.params.id } 
    app.render(req, res, actualPage, queryParams)
  });

  server.get('/file/:id/:page', (req, res) => {
    const actualPage = '/page'
    const queryParams = { 
      id: req.params.id,
      page: req.params.page 
    }; 
    app.render(req, res, actualPage, queryParams)
  });

  server.get('/api/file/:id/:page', (req, res) => {
    const file = fb.db.collection('files').doc(req.params.id);
    file.get()
    .then(doc => {
      if (!doc.exists) {
        res.status(404).send(JSON.stringify({a:21}));
      } else {
        let data = doc.data();
        if (data.oldVersion !== data.version) {
          request({
            uri: `https://api.figma.com/v1/files/${req.params.id}`,
            headers: {
              'X-FIGMA-TOKEN': '2632-41a309eb-5f9f-4829-8aca-cc0963bb0857'
            },
            qs: {
              'version' : data.version
            }
          })
          .then((body)=>{
            const newFile = modiFileB(body);
            request({
              uri: `https://api.figma.com/v1/files/${req.params.id}`,
              headers: {
                'X-FIGMA-TOKEN': '2632-41a309eb-5f9f-4829-8aca-cc0963bb0857'
              },
              qs : {
                'version' : data.oldVersion
              }
            })
            .then((oldBody) => {
              const oldFile = modiFileB(oldBody);
              const newPage = newFile.document.children[req.params.page];
              const oldPage = oldFile.document.children[req.params.page];

              newPage.children = modiFileC(newPage.children);
              oldPage.children = modiFileC(oldPage.children);

              let imgQueue = [];

              for (let i = 0 ; i < newPage.children.length; i++) {
                if (oldPage.children[i] !== undefined && oldPage.children[i] !== newPage.children[i]) {
                  imgQueue.push(JSON.parse(newPage.children[i]).id);
                }
              }

              console.log(imgQueue);
              let imgString = imgQueue.join(',');
              let images = getImgList(req.params.id, imgString);
              images.then((body)=>{
                body = JSON.parse(body);
                res.json({
                  images: body.images,
                });
              });
            })
            .catch((err) => {
              console.log(err);
            });
          })
          .catch((err)=>{
            console.log(err);
          });

        } else {
          console.log('b');
        }
      }
    });
  });

  server.get('/api/file/:id', (req, res) => {
    const docRef = fb.db.collection('files').doc(req.params.id);
    docRef.get()
    .then(doc => {
      if (!doc.exists) {
        res.status(404).send(JSON.stringify({a:21}));
      } else {
        let originVersion = doc.data().version;
        request({
          uri: `https://api.figma.com/v1/files/${req.params.id}`,
          headers: {
            'X-FIGMA-TOKEN': '2632-41a309eb-5f9f-4829-8aca-cc0963bb0857'
          }
        })
        .then((body)=>{
          const newFile = modiFileB(body);

          request({
            uri: `https://api.figma.com/v1/files/${req.params.id}`,
            headers: {
              'X-FIGMA-TOKEN': '2632-41a309eb-5f9f-4829-8aca-cc0963bb0857'
            },
            qs : {
              'version' : originVersion
            }
          })
          .then((oldBody)=>{
            const oldFile = modiFileB(oldBody);
            const newPages = newFile.document.children;
            const oldPages = oldFile.document.children;
            let miniPages = [];
            let imgQueue = newPages.map(item => item.id);
            let imgString = imgQueue.join(',');

            let images = getImgList(req.params.id, imgString);
            images
              .then((content)=>{
                content = JSON.parse(content);

                for (let i = 0; i < newPages.length; i++) {
                  if (oldPages[i] !== undefined && oldPages[i].children !== newPages[i].children) {
                    miniPages.push({
                      id: newPages[i].id,
                      name: newPages[i].name + 'with new!'  
                    });
                  } else {
                    miniPages.push(
                      {
                        id: newPages[i].id,
                        name: newPages[i].name
                      }
                    );
                  }
                }

                request({
                  uri: `https://api.figma.com/v1/files/${req.params.id}/versions`,
                  headers: {
                    'X-FIGMA-TOKEN': '2632-41a309eb-5f9f-4829-8aca-cc0963bb0857'
                  }
                })
                .then((body)=>{
                  body = JSON.parse(body);
                  docRef.update({
                    version : body.versions[0].id,
                    oldVersion : originVersion
                  });
                })
                .catch((err)=>{
                  console.log(err);
                });

                res.json({
                  images: content.images,
                  pages: miniPages
                });
              })
              .catch((err)=>{
                console.log(err);
              });

          })
          .catch((err)=>{
            console.log(err);
          });

        })
        .catch((err)=>{
          console.log(err);
        });
      }
    });
  });

  server.post('/api/create-project', (req,res) => {
    createFile(req.body.id, req.body.name);
    res.send('2121');
  });

  server.get('*', (req, res) => {
    return handle(req, res)
  });

  server.listen(3000, (err) => {
    if (err) throw err
    console.log('> Ready on http://localhost:3000')
  });
})
.catch((ex) => {
  console.error(ex.stack)
  process.exit(1)
})