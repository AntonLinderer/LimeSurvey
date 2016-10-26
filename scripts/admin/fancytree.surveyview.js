/**
 * Generation of a fancytree closure
 * 
 * the Fancytree is ajax-generated and though should be very performant when running in the page.
 * @param jQTreeItem [jQuery|selector] => This is the Element in which the fanctree will be generated
 * @param searchInput [jQuery|selector] => This is the searchinput element which should be generated by php
 * @param sourceUrl [string] => The URI from where to get the questiontree-data
 * @param questionDetailUrl [string] => The URI from where to get the 
 */
var CreateFancytree = function (jQTreeItem, searchInput, sourceUrl, questionDetailUrl) {

    jQTreeItem = $(jQTreeItem);
    searchInput = $(searchInput);

    var fancytree = null;
    var glyph_opts = {
        map: {
            doc: "fa fa-file-o",
            docOpen: "fa fa-file-o",
            checkbox: "fa fa-square-o",
            checkboxSelected: "fa fa-check-square-o",
            checkboxUnknown: "fa fa-share",
            dragHelper: "glyphicon glyphicon-play",
            dropMarker: "glyphicon glyphicon-arrow-right",
            error: "glyphicon glyphicon-warning-sign",
            expanderClosed: "fa fa-caret-right",
            expanderLazy: "fa fa-caret-right",  // glyphicon-plus-sign
            expanderOpen: "fa fa-caret-down",  // glyphicon-collapse-down
            folder: "fa fa-folder-o",
            folderOpen: "fa fa-folder-open-o",
            loading: "glyphicon glyphicon-refresh glyphicon-spin"
        }
    };
    var createTree = function (nodeKey) {
        var fancytree = jQTreeItem.fancytree({

            extensions: ["glyph", "bstooltip", "filter", "bsbuttonbar"],
            extraClasses: "lsi-fancytree-node",
            source: {
                url: sourceUrl,
                cache: false
            },
            glyph: glyph_opts,
            selectMode: 2,
            clickFolderMode: 3,
            init: function (e, d) {
                if (nodeKey !== false) {
                    d.tree.activateKey(nodeKey);
                }
            },
            dblclick: function (event, data) {
                if ($(event.toElement).closest('a').hasClass('deleteNode') || $(event.toElement).hasClass('deleteNode')) {
                    event.preventDefault();
                    return false;
                }
                var node = data.node;
                // Use <a> href and target attributes to load the content:
                if (node.data.href) {
                    // Open target
                    window.location.href = node.data.href;
                }
            },
            click: function (event, data) {
                if ($(event.toElement).closest('a').hasClass('deleteNode') || $(event.toElement).hasClass('deleteNode')) {
                    var element = (
                        ($(event.toElement).closest('a').length > 0)
                            ? $(event.toElement).closest('a')
                            : $(event.toElement)
                    );
                    return;
                }
                var node = data.node;
                if (node.data.gid == node.key) {
                    var data = { gid: node.key };
                } else {
                    var data = { gid: node.data.gid, qid: node.key };
                }
                if (node.isActive()) {
                    if (node.isExpanded() && !$(event.toElement).hasClass('fancytree-expander')) { event.preventDefault(); }
                    $.ajax({
                        url: questionDetailUrl,
                        data: data,
                        method: "GET",
                        dataType: "json"
                    }).then(
                        function (success) {
                            $(node.span).find('.fancytree-title').popover({
                                title: success.title,
                                content: success.content,
                                placement: 'right',
                                html: true,
                                delay: { show: 200, hide: 4000 },
                                container: $('body')
                            }).popover('show');
                            $('body').on('click.singlePopover', function () {
                                $(node.span).find('.fancytree-title').popover('destroy');
                                $('body').off('click.singlePopover');
                            });
                        },
                        function (error) {
                            console.log(error);
                        }
                        );
                }
            },
            wide: {
                iconWidth: "1em",     // Adjust this if @fancy-icon-width != "16px"
                iconSpacing: "0.5em", // Adjust this if @fancy-icon-spacing != "3px"
                levelOfs: "1.5em"     // Adjust this if ul padding != "16px"
            },
            expand: function (event, data) {
                jQTreeItem.trigger('nodeExpanded', event, data);
            },
            collapse: function (event, data) {
                jQTreeItem.trigger('nodeCollapsed', event, data);
            },
            filter: { mode: 'hide' },
            autoscroll: true

        });

        return fancytree;
    },
        bindToSearch = function (tree) {
            var keyEventBreakOnEnter = function (e) {
                //catch the enterkey
                var code = e.which;
                if (code == 13) {
                    e.preventDefault();
                }
            };
            $(searchInput).on('keydown', keyEventBreakOnEnter);
            $(searchInput).on('keypress', keyEventBreakOnEnter);
            $(searchInput).on('keyup', function (e) {
                keyEventBreakOnEnter(e);
                var search = $(this).val(),
                    re = new RegExp(".*" + search + ".*", "i"),
                    re2 = new RegExp(search, "gi"),
                    filter = function (node) {
                        var display,
                            questionCode = node.title.substring(0, node.title.indexOf(':')),
                            question = node.title.substring(node.title.indexOf(':') + 1),
                            //  res = !!re.test(text);
                            res = !(!re.test(questionCode) && !re.test(question))
                        if (res) {
                            console.log("questionCode: ", questionCode);
                            console.log("question: ", question);
                        }
                        return res;
                    };
                tree.filterNodes(filter, { autoExpand: true, statusNode: true });
            });
        },
        bindExpandCollapse = function (tree) {
            var showExpandAndCollapse = jQTreeItem.data("show-expand-collapse") || false,
                expandAll = jQTreeItem.data("expand-all"),
                collapseAll = jQTreeItem.data("collapse-all"),
                buttonExpand = $("<a href='#' class='btn btn-default noChangeBorder'></a>"),
                buttonCollapse = $("<a href='#' class='btn btn-default noChangeBorder'></a>"),
                buttonGroup = $("<div class='btn-group btn-group-justified'></div>"),
                buttonContainer = $("<div class='row row-with-margin'></div>");
            if ((showExpandAndCollapse == true)) {
                buttonExpand.text(expandAll);
                buttonCollapse.text(collapseAll);

                buttonExpand.on('click', function (e) {
                    e.preventDefault();
                    // Expand all tree nodes
                    tree.visit(function (node) {
                        node.setExpanded(true);
                    });
                    return false;
                });
                buttonCollapse.on('click', function (e) {
                    e.preventDefault();
                    // Collapse all tree nodes
                    tree.visit(function (node) {
                        node.setExpanded(false);
                    });
                    return false;
                });
                buttonGroup.append(buttonCollapse).append(buttonExpand);
                buttonContainer.append(buttonGroup);
                jQTreeItem.before(buttonContainer);
            }
        },
        run = function (questionId, questionGroupId) {
            questionId = questionId || false;
            questionGroupId = questionGroupId || false;

            var nodeKey = questionId || questionGroupId || false;

            fancytree = createTree(nodeKey);
            var tree = fancytree.fancytree("getTree");
            bindToSearch(tree);
            bindExpandCollapse(tree);

            return tree;
        };

    return {
        run: run
    };
};