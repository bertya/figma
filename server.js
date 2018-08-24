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
  for (let i = 0; i < doc.children.length; i++) {
    doc.children[i].children = JSON.stringify(doc.children[i].children);
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

  server.get('/api/file/:id', (req, res) => {
    const file = fb.db.collection('files').doc(req.params.id);
    file.get()
    .then(doc => {
      if (!doc.exists) {
        res.status(404).send(JSON.stringify({a:21}));
      } else {
        let data = doc.data();

        request({
          uri: `https://api.figma.com/v1/files/${req.params.id}`,
          headers: {
            'X-FIGMA-TOKEN': '2632-41a309eb-5f9f-4829-8aca-cc0963bb0857'
          }
        })
        .then((body)=>{
          const file = modiFile(body);
          file.name = data.name;
          const docRef = fb.db.collection('files').doc(req.params.id);
          const newPages = file.document.children;
          let imgQueue = newPages.map(item => item.id);
          let imgString = imgQueue.join(',');
          const pages = data.document.children;
          
          let images = getImgList(req.params.id, imgString);
          images
          .then((body)=>{
            body = JSON.parse(body);
            // let miniPages = newPages.map(page => {
            //   return {
            //     id : page.id,
            //     name : page.name
            //   };
            // });
            let miniPages = [];
            for (let i = 0; i < newPages.length; i++) {
              if (pages[i] !== undefined && pages[i].children !== newPages[i].children) {
                file.document.children[i].oldChildren = pages[i].children;
                file.document.children[i].oldVerion = data.version;
                console.log(file.document.children[i]);
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
              file.version = body.versions[0].id;
              docRef.set(file);
            })
            .catch((err)=>{
              console.log(err);
            });

            res.json({
              images: body.images,
              pages: miniPages
            });
          })
          .catch((err)=>{
            res.json({err});
          });
        })
        .catch((err)=>{
          console.log(err);
        });
      }
    })
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