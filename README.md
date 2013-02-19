dorm
==========

An ORM for node.js built for efficiency and flexibility. (but for now is very alpha!)

Define an entity, corresponding to a table in a database (user_roles in this example):

<pre>
<code>
var UserRole = Entity.create({type: 'user_role', table:'user_roles'}).define([
    { id:Fields.PrimaryKeyField() },
    { name: Fields.StringField() }
]);
</code>
</pre>

Get a single entity by id:

<pre><code>
  dorm.get(e.UserRole, 1234);
</code></pre>

With a where:

<pre><code>
dorm.get(Entities.Node, {
    where : {
        id : {
            cmp:'=',
            value:1
        }
    }
});

TODO: add more detailed examples.

</code></pre>

*Supported Databases:*
 * PostgreSQL > 8

## License 

(The MIT License)

Copyright (c) 2013 Daniel Werner &lt;dan.werner@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
