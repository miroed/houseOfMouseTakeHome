/**
 * @param {string} str
 * @return {string} encoded HTML
 */
function sanitizeHTML(str) {
  return str.replace(/[^\w. ]/gi, function (c) {
    return "&#" + c.charCodeAt(0) + ";";
  });
};

// TODO: the following all do, basically, the same thing
//  get the keys of some object and return some property
//  based on getting the first key - should refactored later
/**
 * @param {object} tileImages
 * @return {string} URL
 */
function getImage(tileImages) {
  const tileImageKeys = Object.keys(tileImages);
  return tileImages[tileImageKeys[0]].default.url;
}

/**
 * @param {object} itemTitle
 * @return {string} title
 */
function getTitle(itemTitle) {
  const itemTitleKeys = Object.keys(itemTitle);
  return itemTitle[itemTitleKeys[0]].default.content;
}

/**
 * @param {object} content
 * @return {string} URL
 */
function getContent(content) {
  const contentKeys = Object.keys(content);
  return content[contentKeys[0]].items;
}


/**
 * Callback function for IntersectionObserver in index.js
 * @param {*} categories
 * @param {*} observer
 */
function categoryObserver(categories, observer) {
	const self = this;
	categories.forEach(function (category) {
		const $category = $(category.target);
		const $categoryId = parseInt($category.attr('id'), 10);
		const $categoryRefId = $category.data("refId");
		if (
      category.isIntersecting
      && category.intersectionRatio >= 0.6
      && $categoryRefId
    ) {

      fetch(
        `https://cd-static.bamgrid.com/dp-117731241344/sets/${$categoryRefId}.json`
      )
        .then((response) => response.json())
        .then(({ data }) => {
					self.updateContent($categoryId, getContent(data));
					self.populateContent($category.find('.category__list'), $categoryId);
					$category.attr("data-category-item-count", getContent(data).length);
				})
        .catch((error) => console.log(error));

      observer.unobserve($category[0]);
    }
	})
}

/**
 * Structures the list items in each category
 * @param {integer} row
 * @param {integer} col
 * @param {object} item
 * @return {string}
 */
function categoryItem(row, col, item) {
  return `
    <li 
      class="category__item${
        row === 0 && col === 0 ? " category__item--focused" : ""
      }" 
      data-grid-row="${row}" 
      data-grid-col="${col}"
      title="${sanitizeHTML(getTitle(item.text.title.full))}"
      aria-label="${sanitizeHTML(getTitle(item.text.title.full))}"
    >
      <a class="item__link" tabindex="0" role="button">
        <img 
            src="${sanitizeHTML(getImage(item.image.tile["1.78"]))}" 
            alt="${sanitizeHTML(getTitle(item.text.title.full))}" 
            class="item__image" 
        />
      </a>
    </li>
  `;
}


/**
 * Updates the currently active grid element
 *  based on the this.focusPoint array
 * It also dynamically adds/removes category
 *  items - TODO: which I would move that functionality
 *  to another function
 * @param {string} direction
 * @param {array} gridFocus
 * @param {array} gridContent
 */
function updateFocus(direction, gridFocus, gridContent) {
  const directions = ["right", "left"]; // directions that affect scrolling within category
  const $currentFocused = $(
    `.category#${gridFocus[0]} li:nth-child(${gridFocus[1] + 1})`
  );
  const $firstItemInRow = $currentFocused
    .closest(".category__list")
    .find(".category__item:first");
  const $lastItemInRow = $currentFocused
    .closest(".category__list")
    .find(".category__item:last");
  const currentCol = parseInt($currentFocused.data("gridCol"), 10);
  const currentRow = parseInt($currentFocused.data("gridRow"), 10);
  const getRowCount = parseInt(
    $currentFocused.closest(".category").data("categoryItemCount"),
    10
  );

  if (
    directions.includes(direction) 
    && gridFocus[1] === 0 
    && currentCol > 0
  ) {
    $lastItemInRow.remove();
    $currentFocused
      .closest(".category__list")
      .prepend(
        categoryItem(
          currentRow,
          currentCol - 1,
          gridContent[currentRow][currentCol - 1]
        )
      );
  }

  if (
    directions.includes(direction)
    && gridFocus[1] === 4
    && currentCol < (getRowCount - 1)
  ) {
    $firstItemInRow.remove();
    $currentFocused
      .closest(".category__list")
      .append(
        categoryItem(
          currentRow,
          currentCol + 1,
          gridContent[currentRow][currentCol + 1]
        )
      );
  }

  $(".category__item").removeClass("category__item--focused");

  $(`.category#${gridFocus[0]} li:nth-child(${gridFocus[1] + 1})`).addClass(
    "category__item--focused"
  );
}


/**
 * Constructor function
 * @param {object} categories
 * @param {array} content
 */
function Mouse(categories, content) {
  this.focusPoint = [0, 0];
  this.categories = categories || {};
  this.content = content || [];
}

/**
 * Returns categories
 * @return {object} categories
 */
Mouse.prototype.getCategories = function () {
  return this.categories;
};

/**
 * Returns content matrix
 * @return {array} categories
 */
Mouse.prototype.getContent = function () {
  return this.content;
};

/**
 * Renders content to an element on the page
 * @param {element} renderTo
 * @param {integer} contentKey
 */
Mouse.prototype.populateContent = function (renderTo, contentKey) {
  let contentToPopulate = [];

  if (contentKey) {
    for (const [index, item] of this.content[contentKey].entries()) {
      if (index === 5) break;
      contentToPopulate.push(categoryItem(contentKey, index, item));
    }
  } else {
    contentToPopulate = Object.keys(this.categories).map((key) => {
      const $currentElement = $("<section>");

      // setup category block
      $currentElement.attr({
        class: "category",
        id: key,
        tabindex: "-1",
        "data-set-id": this.categories[key].id,
        "data-ref-id": this.categories[key].refId,
        "data-category-item-count": this.content[key].length,
      })
      .append(`
        <h3 class="category__name">${sanitizeHTML(
          this.categories[key].title
        )}</h3>
        <div class="category__content">
            <ul class="category__list"></ul>
        </div>
      `);
      
      const $currentContentList = $currentElement.find(".category__list");

      for (const [index, item] of this.content[key].entries()) {
        if (index === 5) break;
        $currentContentList.append(
          categoryItem(parseInt(key, 10), index, item)
        );
      }

      return $currentElement;
    });
  }

  renderTo.append(contentToPopulate);
};

/**
 * Update content in content matrix
 * @param {integer} id
 * @param {array} newContent
 */
Mouse.prototype.updateContent = function (id, newContent) {
  this.content[id] = newContent;
}

/**
 * Updates the focusPoint or the currently active selection
 *  then, it runs the updateFocus function to update the UI
 * @param {string} direction
 */
Mouse.prototype.moveFocus = function (direction) {
  switch (direction) {
    case "up":
      if (this.focusPoint[0] !== 0) {
        this.focusPoint[0] -= 1;
      }
      break;

    case "down":
      if (this.focusPoint[0] < this.content.length - 1) {
        this.focusPoint[0] += 1;
      }
      break;

    case "right":
      if (this.focusPoint[1] < 4) {
        this.focusPoint[1] += 1;
      }
      break;

    default:
      if (this.focusPoint[1] > 0) {
        this.focusPoint[1] -= 1;
      }
      break;
  }

  updateFocus(direction, this.focusPoint, this.content);
};
